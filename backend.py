"""
Chronicle Backend API
FastAPI server handling AI orchestration and character/scene persistence
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import google.generativeai as genai
import os
import json
from datetime import datetime
import logging

# Configure logging to show AI integration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chronicle API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Gemini
# Get free API key at: https://makersuite.google.com/app/apikey
api_key = os.environ.get("GOOGLE_API_KEY", "")
if not api_key:
    logger.error("❌ GOOGLE_API_KEY environment variable not set!")
    logger.error("Get your free key at: https://makersuite.google.com/app/apikey")
    logger.error("Then set it with: export GOOGLE_API_KEY='your-key' (Mac/Linux)")
    logger.error("Or: $env:GOOGLE_API_KEY='your-key' (PowerShell)")
else:
    logger.info(f"✅ Google API key found (starts with: {api_key[:10]}...)")

genai.configure(api_key=api_key)

# List available models to find the right one
logger.info("📋 Listing available Gemini models...")
try:
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            available_models.append(m.name)
            logger.info(f"  ✓ {m.name}")
    
    # Try to use the best available free model
    model_name = None
    preferred_models = [
        'models/gemini-1.5-flash-latest',
        'models/gemini-1.5-flash',
        'models/gemini-pro',
        'models/gemini-1.0-pro',
        'gemini-pro'
    ]
    
    for preferred in preferred_models:
        if preferred in available_models or preferred.replace('models/', '') in [m.replace('models/', '') for m in available_models]:
            model_name = preferred
            logger.info(f"✅ Using model: {model_name}")
            break
    
    if not model_name and available_models:
        model_name = available_models[0]
        logger.info(f"⚠️  Using first available model: {model_name}")
    elif not model_name:
        logger.error("❌ No models available! Check your API key.")
        model_name = "gemini-pro"  # fallback
    
    model = genai.GenerativeModel(model_name)
    
except Exception as e:
    logger.error(f"❌ Error listing models: {e}")
    logger.info("⚠️  Trying default model 'gemini-pro'...")
    model = genai.GenerativeModel('gemini-pro')

# In-memory storage (in production, use PostgreSQL/MongoDB)
characters_db = {}
scenes_db = {}

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CharacterCreate(BaseModel):
    name: str
    canonicalAppearance: str
    personality: str
    emotionalBaseline: str
    immutableTraits: List[str]

class Character(BaseModel):
    id: str
    name: str
    canonicalAppearance: str
    personality: str
    emotionalBaseline: str
    immutableTraits: List[str]
    createdAt: str

class Scene(BaseModel):
    id: str
    characterId: str
    sceneNumber: int
    sceneDescription: str
    visualPrompt: str
    emotionalState: str
    environment: str
    narrativeSummary: str
    timestamp: str
    edits: List[Dict[str, Any]]
    previousSceneId: Optional[str] = None
    imageUrl: Optional[str] = None

class EditRequest(BaseModel):
    characterId: str
    sceneId: str
    command: str

class EditAnalysis(BaseModel):
    isValid: bool
    editType: str
    rejectionReason: Optional[str] = None
    constraints: List[str]
    changes: Dict[str, Any]
    narrativeDelta: str

# ============================================================================
# AI ORCHESTRATION FUNCTIONS
# ============================================================================

def generate_first_scene(character: Character) -> Scene:
    """Generate initial scene for a new character using Gemini"""
    
    logger.info(f"🤖 Calling Gemini API to generate first scene for character: {character.name}")
    
    prompt = f"""You are the Scene Orchestrator for Chronicle, a character story engine.

CHARACTER CANON (IMMUTABLE):
Name: {character.name}
Appearance: {character.canonicalAppearance}
Personality: {character.personality}
Emotional Baseline: {character.emotionalBaseline}
Immutable Traits: {', '.join(character.immutableTraits)}

Generate the FIRST SCENE introducing this character. Respond ONLY with valid JSON (no markdown, no code blocks):

{{
  "sceneDescription": "2-3 sentences describing the scene",
  "visualPrompt": "Detailed image generation prompt maintaining canonical appearance",
  "emotionalState": "current emotion",
  "environment": "location description",
  "narrativeSummary": "what's happening in this moment"
}}

Be creative but STRICTLY honor the character canon. Output ONLY the JSON object, nothing else."""

    response = model.generate_content(prompt)
    
    logger.info(f"✅ Gemini API response received - First scene generated successfully")
    
    response_text = response.text
    # Clean JSON from markdown code blocks if present
    clean_json = response_text.replace("```json", "").replace("```", "").strip()
    scene_data = json.loads(clean_json)
    
    # Create scene object
    scene_id = f"scene_{int(datetime.now().timestamp() * 1000)}"
    scene = Scene(
        id=scene_id,
        characterId=character.id,
        sceneNumber=1,
        sceneDescription=scene_data["sceneDescription"],
        visualPrompt=scene_data["visualPrompt"],
        emotionalState=scene_data["emotionalState"],
        environment=scene_data["environment"],
        narrativeSummary=scene_data["narrativeSummary"],
        timestamp=datetime.now().isoformat(),
        edits=[]
    )
    
    return scene


def parse_edit_command(character: Character, current_scene: Scene, command: str) -> EditAnalysis:
    """Parse natural language edit command and validate against character canon"""
    
    logger.info(f"🤖 Calling Gemini API to PARSE edit command: '{command}'")
    
    prompt = f"""You are the Edit Parser for Chronicle. Analyze this edit command.

CHARACTER CANON (IMMUTABLE):
Name: {character.name}
Appearance: {character.canonicalAppearance}
Personality: {character.personality}
Immutable Traits: {', '.join(character.immutableTraits)}

CURRENT SCENE:
{current_scene.sceneDescription}
Emotional State: {current_scene.emotionalState}
Environment: {current_scene.environment}

USER EDIT COMMAND: "{command}"

Respond ONLY with valid JSON (no markdown, no code blocks):

{{
  "isValid": true or false,
  "editType": "emotion_change" or "environment_change" or "new_scene" or "visual_adjustment" or "invalid",
  "rejectionReason": "why this violates canon (only if invalid)",
  "constraints": ["trait1", "trait2"],
  "changes": {{
    "emotionalState": "new emotion or null",
    "environment": "new environment or null",
    "visualAdjustments": "changes to appearance/lighting/pose"
  }},
  "narrativeDelta": "what changed in the story"
}}

REJECT edits that:
- Change immutable traits ({', '.join(character.immutableTraits)})
- Violate core personality
- Contradict canonical appearance

Output ONLY the JSON object, nothing else."""

    response = model.generate_content(prompt)
    
    response_text = response.text
    clean_json = response_text.replace("```json", "").replace("```", "").strip()
    edit_data = json.loads(clean_json)
    
    edit_analysis = EditAnalysis(**edit_data)
    
    if edit_analysis.isValid:
        logger.info(f"✅ Edit APPROVED - Type: {edit_analysis.editType}")
    else:
        logger.warning(f"❌ Edit REJECTED - Reason: {edit_analysis.rejectionReason}")
    
    return edit_analysis


def generate_evolved_scene(
    character: Character,
    current_scene: Scene,
    edit_analysis: EditAnalysis
) -> Scene:
    """Generate evolved scene based on approved edit"""
    
    logger.info(f"🤖 Calling Gemini API to GENERATE evolved scene (edit type: {edit_analysis.editType})")
    
    prompt = f"""Apply this edit to create an EVOLVED scene (not a reset).

CHARACTER CANON: {character.name} - {character.canonicalAppearance}

PREVIOUS SCENE:
{current_scene.sceneDescription}

APPROVED CHANGES:
{json.dumps(edit_analysis.changes, indent=2)}

Narrative Delta: {edit_analysis.narrativeDelta}

Respond ONLY with valid JSON for the UPDATED scene (no markdown, no code blocks):

{{
  "sceneDescription": "evolved 2-3 sentences",
  "visualPrompt": "updated visual maintaining character canon",
  "emotionalState": "{edit_analysis.changes.get('emotionalState') or current_scene.emotionalState}",
  "environment": "{edit_analysis.changes.get('environment') or current_scene.environment}",
  "narrativeSummary": "what changed"
}}

Output ONLY the JSON object, nothing else."""

    response = model.generate_content(prompt)
    
    logger.info(f"✅ Gemini API response received - Evolved scene generated successfully")
    
    response_text = response.text
    clean_json = response_text.replace("```json", "").replace("```", "").strip()
    scene_data = json.loads(clean_json)
    
    # Get next scene number
    character_scenes = [s for s in scenes_db.values() if s.characterId == character.id]
    next_scene_number = len(character_scenes) + 1
    
    # Create new scene
    scene_id = f"scene_{int(datetime.now().timestamp() * 1000)}"
    new_scene = Scene(
        id=scene_id,
        characterId=character.id,
        sceneNumber=next_scene_number,
        sceneDescription=scene_data["sceneDescription"],
        visualPrompt=scene_data["visualPrompt"],
        emotionalState=scene_data["emotionalState"],
        environment=scene_data["environment"],
        narrativeSummary=scene_data["narrativeSummary"],
        timestamp=datetime.now().isoformat(),
        edits=[{
            "command": edit_analysis.narrativeDelta,
            "editType": edit_analysis.editType,
            "timestamp": datetime.now().isoformat()
        }],
        previousSceneId=current_scene.id
    )
    
    return new_scene


def generate_memory_recap(character: Character, scenes: List[Scene]) -> str:
    """Generate AI-powered memory recap of character's journey"""
    
    logger.info(f"🤖 Calling Gemini API to generate memory recap for {character.name} ({len(scenes)} scenes)")
    
    journey_text = "\n".join([
        f"Scene {s.sceneNumber}: {s.sceneDescription}"
        for s in sorted(scenes, key=lambda x: x.sceneNumber)
    ])
    
    prompt = f"""Generate a memory recap for this character's journey.

CHARACTER: {character.name}
SCENES: {len(scenes)}

Journey:
{journey_text}

Provide a 3-sentence narrative summary of the character's emotional and physical journey."""

    response = model.generate_content(prompt)
    
    logger.info(f"✅ Memory recap generated successfully")
    
    return response.text


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "operational",
        "service": "Chronicle API",
        "version": "1.0.0",
        "endpoints": {
            "characters": "/api/characters",
            "scenes": "/api/scenes",
            "edits": "/api/edits"
        }
    }


@app.post("/api/characters", response_model=Dict[str, Any])
def create_character(character_data: CharacterCreate):
    """Create a new character and generate first scene"""
    
    try:
        # Create character
        character_id = f"char_{int(datetime.now().timestamp() * 1000)}"
        character = Character(
            id=character_id,
            name=character_data.name,
            canonicalAppearance=character_data.canonicalAppearance,
            personality=character_data.personality,
            emotionalBaseline=character_data.emotionalBaseline,
            immutableTraits=character_data.immutableTraits,
            createdAt=datetime.now().isoformat()
        )
        
        # Store character
        characters_db[character_id] = character
        
        # Generate first scene using AI
        first_scene = generate_first_scene(character)
        scenes_db[first_scene.id] = first_scene
        
        return {
            "character": character.dict(),
            "firstScene": first_scene.dict(),
            "message": f"Character '{character.name}' created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating character: {str(e)}")


@app.get("/api/characters/{character_id}", response_model=Character)
def get_character(character_id: str):
    """Get character by ID"""
    
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    return characters_db[character_id]


@app.get("/api/characters/{character_id}/scenes", response_model=List[Scene])
def get_character_scenes(character_id: str):
    """Get all scenes for a character"""
    
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character_scenes = [
        scene for scene in scenes_db.values()
        if scene.characterId == character_id
    ]
    
    return sorted(character_scenes, key=lambda s: s.sceneNumber)


@app.post("/api/edits", response_model=Dict[str, Any])
def process_edit(edit_request: EditRequest):
    """Process natural language edit command"""
    
    try:
        # Validate character exists
        if edit_request.characterId not in characters_db:
            raise HTTPException(status_code=404, detail="Character not found")
        
        # Validate scene exists
        if edit_request.sceneId not in scenes_db:
            raise HTTPException(status_code=404, detail="Scene not found")
        
        character = characters_db[edit_request.characterId]
        current_scene = scenes_db[edit_request.sceneId]
        
        # Step 1: Parse and validate edit using AI
        edit_analysis = parse_edit_command(character, current_scene, edit_request.command)
        
        # Step 2: If invalid, return rejection
        if not edit_analysis.isValid:
            return {
                "success": False,
                "rejected": True,
                "reason": edit_analysis.rejectionReason,
                "editType": edit_analysis.editType
            }
        
        # Step 3: Generate evolved scene
        new_scene = generate_evolved_scene(character, current_scene, edit_analysis)
        scenes_db[new_scene.id] = new_scene
        
        return {
            "success": True,
            "rejected": False,
            "newScene": new_scene.dict(),
            "editType": edit_analysis.editType,
            "narrativeDelta": edit_analysis.narrativeDelta
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing edit: {str(e)}")


@app.get("/api/characters/{character_id}/recap", response_model=Dict[str, str])
def get_memory_recap(character_id: str):
    """Generate AI memory recap for character's journey"""
    
    try:
        if character_id not in characters_db:
            raise HTTPException(status_code=404, detail="Character not found")
        
        character = characters_db[character_id]
        character_scenes = [
            scene for scene in scenes_db.values()
            if scene.characterId == character_id
        ]
        
        if not character_scenes:
            return {"recap": "No scenes yet to generate a recap."}
        
        recap = generate_memory_recap(character, character_scenes)
        
        return {"recap": recap}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recap: {str(e)}")


@app.delete("/api/characters/{character_id}")
def delete_character(character_id: str):
    """Delete character and all associated scenes"""
    
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Delete character
    del characters_db[character_id]
    
    # Delete all scenes for this character
    scene_ids_to_delete = [
        scene_id for scene_id, scene in scenes_db.items()
        if scene.characterId == character_id
    ]
    for scene_id in scene_ids_to_delete:
        del scenes_db[scene_id]
    
    return {
        "message": f"Character and {len(scene_ids_to_delete)} scenes deleted successfully"
    }


# ============================================================================
# DEMO DATA LOADER
# ============================================================================

@app.post("/api/demo/load")
def load_demo_data():
    """Load pre-built demo character with scenes"""
    
    # Create demo character
    demo_character = Character(
        id="char_demo",
        name="Maya Chen",
        canonicalAppearance="Short black hair with silver streaks, sharp brown eyes, wears a worn leather jacket, has a small scar above her left eyebrow",
        personality="Brilliant but haunted detective, driven by unsolved cases, struggles with trust, fiercely protective of the innocent",
        emotionalBaseline="Guarded determination",
        immutableTraits=["brown eyes", "scar above left eyebrow", "leather jacket", "detective nature"],
        createdAt=datetime.now().isoformat()
    )
    
    characters_db[demo_character.id] = demo_character
    
    # Create demo scenes
    demo_scenes = [
        Scene(
            id="scene_demo_1",
            characterId="char_demo",
            sceneNumber=1,
            sceneDescription="Maya sits in her cluttered office, surrounded by case files and cold coffee cups. The late afternoon sun streams through dusty blinds, casting long shadows across photographs pinned to her wall.",
            visualPrompt="Detective woman, short black hair with silver streaks, sharp brown eyes, small scar above left eyebrow, worn leather jacket, sitting at messy desk covered in case files, late afternoon lighting through venetian blinds, noir atmosphere",
            emotionalState="focused",
            environment="cluttered detective office at dusk",
            narrativeSummary="Maya reviews the evidence for the hundredth time, searching for the pattern everyone else missed.",
            timestamp=datetime.now().isoformat(),
            edits=[]
        ),
        Scene(
            id="scene_demo_2",
            characterId="char_demo",
            sceneNumber=2,
            sceneDescription="A sudden realization crosses Maya's face as she notices something in the photographs. Her brown eyes widen, and she leans forward urgently, fingers tracing connections only she can see.",
            visualPrompt="Same detective woman, brown eyes wide with realization, leaning over desk urgently, photographs spread out, dramatic lighting highlighting her scar, leather jacket partially open, moment of breakthrough",
            emotionalState="breakthrough excitement",
            environment="same office, now in early evening",
            narrativeSummary="The pattern finally reveals itself - she knows where to look next.",
            timestamp=datetime.now().isoformat(),
            edits=[{
                "command": "She realizes something important",
                "editType": "emotion_change",
                "timestamp": datetime.now().isoformat()
            }],
            previousSceneId="scene_demo_1"
        ),
        Scene(
            id="scene_demo_3",
            characterId="char_demo",
            sceneNumber=3,
            sceneDescription="Maya stands on a rain-soaked street corner at night, her leather jacket glistening with moisture. The neon signs reflect in puddles around her feet as she watches a building across the street, her expression tense and alert.",
            visualPrompt="Detective woman, short black hair wet from rain, brown eyes vigilant, scar visible, leather jacket wet and reflecting neon lights, standing in rain on city street at night, cyberpunk noir aesthetic",
            emotionalState="vigilant tension",
            environment="rainy city street at night",
            narrativeSummary="She's close now - the suspect is inside. Years of hunting led to this moment.",
            timestamp=datetime.now().isoformat(),
            edits=[{
                "command": "Move the scene to a rainy street at night",
                "editType": "environment_change",
                "timestamp": datetime.now().isoformat()
            }],
            previousSceneId="scene_demo_2"
        ),
        Scene(
            id="scene_demo_4",
            characterId="char_demo",
            sceneNumber=4,
            sceneDescription="Exhaustion shows on Maya's face as she leans against a brick wall in an alley. Dark circles shadow her eyes, her hair disheveled, jacket dirt-stained. But her brown eyes still burn with determination despite the fatigue.",
            visualPrompt="Tired detective woman, short black hair messy, brown eyes with dark circles but still determined, visible scar, dirty worn leather jacket, leaning against brick wall in alley, harsh overhead light",
            emotionalState="exhausted but resolute",
            environment="dark alley, early morning",
            narrativeSummary="The chase has taken its toll, but Maya won't stop - she never does.",
            timestamp=datetime.now().isoformat(),
            edits=[{
                "command": "Make her look exhausted and worn down",
                "editType": "visual_adjustment",
                "timestamp": datetime.now().isoformat()
            }],
            previousSceneId="scene_demo_3"
        )
    ]
    
    for scene in demo_scenes:
        scenes_db[scene.id] = scene
    
    return {
        "character": demo_character.dict(),
        "scenes": [s.dict() for s in demo_scenes],
        "message": "Demo data loaded successfully"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)