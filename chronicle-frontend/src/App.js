import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  User,
  Film,
  Edit3,
  Lock,
  Unlock,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Play,
} from "lucide-react";

// Chronicle Frontend - Connects to Backend API
// Backend handles all AI orchestration and persistence

// Configure API endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function Chronicle() {
  // Load initial state from localStorage
  const loadFromStorage = () => {
    try {
      const savedCharacter = localStorage.getItem('chronicle_character');
      const savedScenes = localStorage.getItem('chronicle_scenes');
      const savedStep = localStorage.getItem('chronicle_step');
      const savedSelectedSceneId = localStorage.getItem('chronicle_selectedSceneId');

      return {
        character: savedCharacter ? JSON.parse(savedCharacter) : null,
        scenes: savedScenes ? JSON.parse(savedScenes) : [],
        step: savedStep || "intro",
        selectedSceneId: savedSelectedSceneId || null,
      };
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return {
        character: null,
        scenes: [],
        step: "intro",
        selectedSceneId: null,
      };
    }
  };

  const initialState = loadFromStorage();

  const [step, setStep] = useState(initialState.step);
  const [character, setCharacter] = useState(initialState.character);
  const [scenes, setScenes] = useState(initialState.scenes);
  const [selectedSceneId, setSelectedSceneId] = useState(initialState.selectedSceneId);
  const [editCommand, setEditCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemMessage, setSystemMessage] = useState(null);
  const [canonLocked, setCanonLocked] = useState(true);
  const [consistencyScore, setConsistencyScore] = useState(100);

  const timelineRef = useRef(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      if (character) {
        localStorage.setItem('chronicle_character', JSON.stringify(character));
      } else {
        localStorage.removeItem('chronicle_character');
      }
    } catch (error) {
      console.error('Error saving character to localStorage:', error);
    }
  }, [character]);

  useEffect(() => {
    try {
      if (scenes.length > 0) {
        localStorage.setItem('chronicle_scenes', JSON.stringify(scenes));
      } else {
        localStorage.removeItem('chronicle_scenes');
      }
    } catch (error) {
      console.error('Error saving scenes to localStorage:', error);
    }
  }, [scenes]);

  useEffect(() => {
    try {
      localStorage.setItem('chronicle_step', step);
    } catch (error) {
      console.error('Error saving step to localStorage:', error);
    }
  }, [step]);

  useEffect(() => {
    try {
      if (selectedSceneId) {
        localStorage.setItem('chronicle_selectedSceneId', selectedSceneId);
      } else {
        localStorage.removeItem('chronicle_selectedSceneId');
      }
    } catch (error) {
      console.error('Error saving selectedSceneId to localStorage:', error);
    }
  }, [selectedSceneId]);

  // API Helper Functions
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const calculateConsistencyScore = () => {
    if (scenes.length === 0) return 100;
    let score = 100;
    const complexityPenalty = Math.min(scenes.length * 0.5, 10);
    score -= complexityPenalty;
    const totalEdits = scenes.reduce(
      (sum, scene) => sum + scene.edits.length,
      0
    );
    const visualAdjustments = scenes.reduce(
      (sum, scene) =>
        sum +
        scene.edits.filter((e) => e.editType === "visual_adjustment").length,
      0
    );
    if (totalEdits > 0) {
      const visualRatio = visualAdjustments / totalEdits;
      score += visualRatio * 5;
    }
    if (scenes.length >= 4) score += 5;
    return Math.max(85, Math.min(100, Math.round(score)));
  };

  useEffect(() => {
    if (scenes.length > 0) {
      setConsistencyScore(calculateConsistencyScore());
    }
  }, [scenes]);

  const resetSystem = async () => {
    if (
      !window.confirm("Reset system? This will delete the current character and all history.")
    )
      return;
    try {
      if (character) {
        await apiCall(`/api/characters/${character.id}`, { method: "DELETE" });
      }
      // Clear state
      setCharacter(null);
      setScenes([]);
      setSelectedSceneId(null);
      setStep("intro");

      // Clear localStorage
      localStorage.removeItem('chronicle_character');
      localStorage.removeItem('chronicle_scenes');
      localStorage.removeItem('chronicle_selectedSceneId');
      localStorage.setItem('chronicle_step', 'intro');

      showMessage("System reset complete", "info");
    } catch (error) {
      showMessage("Failed to reset system", "error");
    }
  };

  const loadDemoData = async () => {
    setIsProcessing(true);
    try {
      const data = await apiCall("/api/demo/load", { method: "POST" });
      setCharacter(data.character);
      setScenes(data.scenes);
      setSelectedSceneId(data.scenes[data.scenes.length - 1].id);
      setStep("story-mode");
      showMessage("Demo character loaded successfully!", "success");
    } catch (error) {
      showMessage("Failed to load demo data", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const createCharacter = async (formData) => {
    setIsProcessing(true);
    try {
      const data = await apiCall("/api/characters", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          canonicalAppearance: formData.appearance,
          personality: formData.personality,
          emotionalBaseline: formData.emotionalBaseline,
          immutableTraits: formData.immutableTraits
            .split(",")
            .map((t) => t.trim()),
        }),
      });

      setCharacter(data.character);
      setScenes([data.firstScene]);
      setSelectedSceneId(data.firstScene.id);
      setStep("story-mode");
      showMessage(data.message, "success");
    } catch (error) {
      showMessage("Failed to create character: " + error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const processEditCommand = async () => {
    if (!editCommand.trim() || !selectedSceneId) return;

    setIsProcessing(true);
    try {
      const data = await apiCall("/api/edits", {
        method: "POST",
        body: JSON.stringify({
          characterId: character.id,
          sceneId: selectedSceneId,
          command: editCommand,
        }),
      });

      if (data.rejected) {
        showMessage(`Edit rejected: ${data.reason}`, "error");
      } else {
        const updatedScenes = [...scenes, data.newScene];
        setScenes(updatedScenes);
        setSelectedSceneId(data.newScene.id);
        showMessage("Scene evolved successfully", "success");

        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
          }
        }, 100);
      }

      setEditCommand("");
    } catch (error) {
      showMessage("Failed to process edit: " + error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMemoryRecap = async () => {
    if (!character || scenes.length === 0) return;

    setIsProcessing(true);
    try {
      const data = await apiCall(`/api/characters/${character.id}/recap`);
      showMessage(data.recap, "info");
    } catch (error) {
      showMessage("Failed to generate recap", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const showMessage = (message, type) => {
    setSystemMessage({ message, type });
    setTimeout(() => setSystemMessage(null), 6000);
  };

  const CharacterForm = () => {
    const [formData, setFormData] = useState({
      name: "",
      appearance: "",
      personality: "",
      emotionalBaseline: "",
      immutableTraits: "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      createCharacter(formData);
    };

    return (
      <div className="character-creation">
        <div className="creation-header">
          <User size={32} />
          <h2>Define Character Canon</h2>
          <p>These traits will persist across all scenes and cannot drift</p>
        </div>

        <form onSubmit={handleSubmit} className="character-form">
          <div className="form-group">
            <label>
              <Lock size={16} /> Character Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Elena Reeves"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Canonical Appearance
            </label>
            <textarea
              value={formData.appearance}
              onChange={(e) =>
                setFormData({ ...formData, appearance: e.target.value })
              }
              placeholder="e.g., Dark curly hair, green eyes, athletic build, silver compass necklace"
              required
              rows={3}
            />
            <small>This visual identity is immutable</small>
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Core Personality
            </label>
            <textarea
              value={formData.personality}
              onChange={(e) =>
                setFormData({ ...formData, personality: e.target.value })
              }
              placeholder="e.g., Cautious yet curious, loyal to friends, struggles with authority"
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Emotional Baseline</label>
            <input
              type="text"
              value={formData.emotionalBaseline}
              onChange={(e) =>
                setFormData({ ...formData, emotionalBaseline: e.target.value })
              }
              placeholder="e.g., Thoughtful melancholy"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Immutable Traits (comma-separated)
            </label>
            <input
              type="text"
              value={formData.immutableTraits}
              onChange={(e) =>
                setFormData({ ...formData, immutableTraits: e.target.value })
              }
              placeholder="e.g., green eyes, silver necklace, moral compass"
              required
            />
            <small>These can NEVER be edited in scenes</small>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isProcessing}
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                Create Character & First Scene
                <Sparkles size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    );
  };

  if (step === "intro") {
    // Check if there's saved data
    const hasSavedData = character && scenes.length > 0;

    return (
      <div className="chronicle-app">
        <div className="intro-screen">
          <div className="intro-content">
            <div className="logo-section">
              <Film size={64} strokeWidth={1} />
              <h1 className="app-title">Chronicle</h1>
              <p className="app-subtitle">Character Story Engine</p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <Lock size={24} />
                <h3>Persistent Identity</h3>
                <p>Characters maintain canonical traits across all scenes</p>
              </div>
              <div className="feature-card">
                <Film size={24} />
                <h3>Scene Evolution</h3>
                <p>Scenes transform and evolve, never reset</p>
              </div>
              <div className="feature-card">
                <Edit3 size={24} />
                <h3>Natural Language Editing</h3>
                <p>Edit with plain English, powered by AI</p>
              </div>
            </div>

            {hasSavedData && (
              <button
                className="continue-button"
                onClick={() => {
                  setSelectedSceneId(scenes[scenes.length - 1].id);
                  setStep("story-mode");
                }}
              >
                <Play size={20} />
                Continue with {character.name}
                <span className="scene-count-badge">{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</span>
              </button>
            )}

            <button
              className="cta-button"
              onClick={() => setStep("create-character")}
            >
              {hasSavedData ? 'Create New Character' : 'Create Your First Character'}
              <ChevronRight size={20} />
            </button>

            <button
              className="demo-button"
              onClick={loadDemoData}
              disabled={isProcessing}
            >
              <Sparkles size={18} />
              {isProcessing ? "Loading..." : "Try Demo Character"}
            </button>

            <p className="intro-footer">
              Chronicle uses AI-powered backend to maintain character
              consistency across scenes. Your characters evolve, but never
              drift.
            </p>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (step === "create-character") {
    return (
      <div className="chronicle-app">
        {systemMessage && (
          <div className={`system-message ${systemMessage.type}`}>
            {systemMessage.type === "success" && <Check size={18} />}
            {systemMessage.type === "error" && <X size={18} />}
            {systemMessage.type === "info" && <AlertCircle size={18} />}
            <span>{systemMessage.message}</span>
          </div>
        )}
        <div style={{ padding: "1rem 2rem" }}>
          <button
            className="text-button"
            onClick={() => setStep("intro")}
            style={{ marginBottom: "1rem" }}
          >
            ← Back to Home
          </button>
        </div>
        <CharacterForm />
        <style>{styles}</style>
      </div>
    );
  }

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  return (
    <div className="chronicle-app">
      {systemMessage && (
        <div className={`system-message ${systemMessage.type}`}>
          {systemMessage.type === "success" && <Check size={18} />}
          {systemMessage.type === "error" && <X size={18} />}
          {systemMessage.type === "info" && <AlertCircle size={18} />}
          <span>{systemMessage.message}</span>
        </div>
      )}

      <div className="story-mode">
        <div className="story-header">
          <div className="header-left">
            <Film size={24} />
            <div>
              <h2>{character.name}</h2>
              <div className="header-meta">
                <span className="scene-count">
                  {scenes.length} Scene{scenes.length !== 1 ? "s" : ""}
                </span>
                <span className="consistency-score">
                  <Lock size={12} />
                  Consistency: {consistencyScore}%
                </span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="text-button"
              onClick={() => setStep("intro")}
              title="Back to main page"
            >
              ← Back
            </button>
            <button
              className="icon-button"
              onClick={() => setCanonLocked(!canonLocked)}
              title={canonLocked ? "Canon locked" : "Canon unlocked"}
            >
              {canonLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </button>
            <button
              className="icon-button"
              onClick={generateMemoryRecap}
              title="Generate memory recap"
              disabled={isProcessing}
            >
              <Sparkles size={18} />
            </button>
            <button className="text-button" onClick={resetSystem}>
              Reset System
            </button>
          </div>
        </div>

        <div className="timeline-section">
          <div className="timeline-header">
            <h3>Scene Timeline</h3>
            <span className="timeline-subtitle">
              Evolution, not regeneration
            </span>
          </div>

          {scenes.length > 1 && (
            <div className="emotion-journey">
              <div className="journey-label">Emotional Journey:</div>
              <div className="emotion-flow">
                {scenes.map((scene, i) => (
                  <React.Fragment key={scene.id}>
                    <div className="emotion-node">{scene.emotionalState}</div>
                    {i < scenes.length - 1 && (
                      <ChevronRight size={16} className="emotion-arrow" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="timeline-container" ref={timelineRef}>
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className={`scene-card ${
                  selectedSceneId === scene.id ? "selected" : ""
                }`}
                onClick={() => setSelectedSceneId(scene.id)}
              >
                <div className="scene-number">Scene {scene.sceneNumber}</div>
                <div className="scene-preview">
                  <div className="scene-emotion">{scene.emotionalState}</div>
                  <div className="scene-env">{scene.environment}</div>
                </div>
                <div className="scene-description">
                  {scene.sceneDescription}
                </div>
                {scene.edits.length > 0 && (
                  <div className="edit-badge">
                    <Edit3 size={12} />
                    {scene.edits.length} edit
                    {scene.edits.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          <div className="scene-detail">
            <div className="scene-detail-header">
              <h3>Scene {selectedScene?.sceneNumber}</h3>
              <div className="scene-meta">
                <span className="emotion-tag">
                  {selectedScene?.emotionalState}
                </span>
                <span className="env-tag">{selectedScene?.environment}</span>
              </div>
            </div>

            <div className="scene-detail-content">
              <div className="scene-narrative">
                <h4>Narrative</h4>
                <p>
                  {selectedScene?.narrativeSummary ||
                    selectedScene?.sceneDescription}
                </p>
              </div>

              <div className="scene-info-section">
                <h4>Visual Prompt</h4>
                <p className="visual-prompt-text">{selectedScene?.visualPrompt}</p>
              </div>

              {selectedScene?.edits.length > 0 && (
                <div className="edit-history">
                  <h4>Edit History</h4>
                  {selectedScene.edits.map((edit, i) => (
                    <div key={i} className="edit-item">
                      <Edit3 size={14} />
                      <span>"{edit.command}"</span>
                      <span className="edit-type">{edit.editType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="editor-panel">
            <div className="editor-header">
              <Film size={20} />
              <h3>Scene Controls</h3>
            </div>

            <div className="editor-content">
              <div className="scene-visual-area">
                {selectedScene?.imageUrl ? (
                  <img
                    src={selectedScene.imageUrl}
                    alt={selectedScene.sceneDescription}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      height: "auto",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="visual-placeholder"
                  style={{
                    display: selectedScene?.imageUrl ? "none" : "flex",
                  }}
                >
                  <Film size={48} strokeWidth={1} />
                  <p className="visual-prompt-preview">
                    {selectedScene?.visualPrompt?.substring(0, 100)}...
                  </p>
                  <small>AI Image Generation</small>
                </div>
              </div>

              <button
              onClick={async () => {
                const confirmed = window.confirm(
                  "Generate an AI image from this prompt?\n\n" +
                    "Note: This uses a free service and may take 10-30 seconds.\n" +
                    "Images are AI-generated and may vary in quality."
                );
                if (!confirmed) return;

                setIsProcessing(true);
                setSystemMessage({
                  message:
                    "Generating image... This may take 10-30 seconds",
                  type: "info",
                });

                try {
                  // Using Pollinations.ai free API (no key required!)
                  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
                    selectedScene.visualPrompt
                  )}?width=1024&height=576&nologo=true&seed=${Date.now()}`;

                  // Preload the image to ensure it's ready
                  await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                  });

                  // Update the scene with the image URL
                  const updatedScenes = scenes.map((s) =>
                    s.id === selectedScene.id ? { ...s, imageUrl } : s
                  );
                  setScenes(updatedScenes);

                  showMessage("Image generated successfully!", "success");
                } catch (error) {
                  console.error("Image generation error:", error);
                  showMessage(
                    "Failed to generate image. Try again.",
                    "error"
                  );
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
              className="generate-image-button"
            >
              <Sparkles size={16} />
              {isProcessing ? "Generating..." : "Generate AI Image"}
            </button>

            <div className="character-canon">
              <h4>
                <Lock size={14} />
                Character Canon
              </h4>
              <div className="canon-traits">
                {character.immutableTraits.map((trait, i) => (
                  <span key={i} className="trait-tag">
                    {trait}
                  </span>
                ))}
              </div>
              <p className="canon-note">
                These traits cannot be modified by edits
              </p>
            </div>

            <div className="edit-examples">
              <h4>Quick Commands:</h4>
              <div className="example-commands">
                <button
                  className="example-cmd"
                  onClick={() =>
                    setEditCommand("Make her look more tired")
                  }
                  disabled={isProcessing}
                >
                  Make her look more tired
                </button>
                <button
                  className="example-cmd"
                  onClick={() =>
                    setEditCommand("Move scene to rainy street")
                  }
                  disabled={isProcessing}
                >
                  Move scene to rainy street
                </button>
                <button
                  className="example-cmd"
                  onClick={() =>
                    setEditCommand("Add dramatic lighting")
                  }
                  disabled={isProcessing}
                >
                  Add dramatic lighting
                </button>
              </div>
            </div>

            <div className="editor-input">
              <label
                style={{
                  display: "block",
                  color: "#d4af37",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Your Command:
              </label>
              <textarea
                value={editCommand}
                onChange={(e) => setEditCommand(e.target.value)}
                placeholder="Describe how you want to evolve this scene..."
                rows={4}
                disabled={isProcessing}
              />
              <button
                className="execute-button"
                onClick={processEditCommand}
                disabled={isProcessing || !editCommand.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Execute Edit
                  </>
                )}
              </button>
              {!editCommand.trim() && !isProcessing && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#8a86a0",
                    marginTop: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  Type a command above to enable this button
                </p>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600;700&family=Work+Sans:wght@300;400;500;600&display=swap');

  .chronicle-app {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    color: #e8e6f0;
    font-family: 'Work Sans', sans-serif;
  }

  body::-webkit-scrollbar {
    width: 12px;
  }

  body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  body::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.4);
    border-radius: 6px;
  }

  body::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.6);
  }

  .intro-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .intro-content {
    max-width: 900px;
    text-align: center;
    animation: fadeInUp 0.8s ease-out;
  }

  .logo-section {
    margin-bottom: 4rem;
  }

  .logo-section svg {
    color: #d4af37;
    margin-bottom: 1rem;
    filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
  }

  .app-title {
    font-family: 'Crimson Pro', serif;
    font-size: 5rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #d4af37 0%, #f8e5a8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.05em;
  }

  .app-subtitle {
    font-size: 1.25rem;
    color: #a8a4c0;
    margin-top: 0.5rem;
    font-weight: 300;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 2rem;
    transition: all 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);
  }

  .feature-card svg {
    color: #d4af37;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    color: #f8e5a8;
  }

  .feature-card p {
    color: #a8a4c0;
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0;
  }

  .continue-button {
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #0f0c29;
    border: none;
    padding: 1.25rem 2.5rem;
    font-size: 1.2rem;
    font-weight: 700;
    border-radius: 50px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s ease;
    box-shadow: 0 6px 25px rgba(212, 175, 55, 0.4);
    margin-bottom: 1.5rem;
    position: relative;
  }

  .continue-button:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 35px rgba(212, 175, 55, 0.6);
  }

  .scene-count-badge {
    background: rgba(15, 12, 41, 0.6);
    color: #d4af37;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .cta-button {
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #0f0c29;
    border: none;
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
  }

  .cta-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 30px rgba(212, 175, 55, 0.5);
  }

  .demo-button {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(212, 175, 55, 0.4);
    color: #d4af37;
    padding: 0.875rem 2rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 50px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    margin-top: 1rem;
  }

  .demo-button:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
    transform: scale(1.02);
  }

  .demo-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .intro-footer {
    margin-top: 3rem;
    color: #6b6880;
    font-size: 0.9rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .character-creation {
    max-width: 700px;
    margin: 0 auto;
    padding: 4rem 2rem;
    animation: fadeInUp 0.6s ease-out;
  }

  .creation-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .creation-header svg {
    color: #d4af37;
    margin-bottom: 1rem;
  }

  .creation-header h2 {
    font-family: 'Crimson Pro', serif;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    color: #f8e5a8;
  }

  .creation-header p {
    color: #a8a4c0;
    font-size: 1rem;
  }

  .character-form {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 16px;
    padding: 2.5rem;
  }

  .form-group {
    margin-bottom: 2rem;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #d4af37;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.875rem;
    color: #e8e6f0;
    font-family: 'Work Sans', sans-serif;
    font-size: 1rem;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  .form-group small {
    display: block;
    margin-top: 0.5rem;
    color: #8a86a0;
    font-size: 0.85rem;
  }

  .submit-button {
    width: 100%;
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #0f0c29;
    border: none;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    margin-top: 2rem;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .story-mode {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .story-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-left svg {
    color: #d4af37;
  }

  .header-left h2 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.75rem;
    margin: 0;
    color: #f8e5a8;
  }

  .header-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-top: 0.25rem;
  }

  .scene-count {
    font-size: 0.85rem;
    color: #a8a4c0;
    font-weight: 400;
  }

  .consistency-score {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #d4af37;
    background: rgba(212, 175, 55, 0.15);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .icon-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #d4af37;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .icon-button:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
  }

  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .text-button {
    background: transparent;
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #d4af37;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }

  .text-button:hover {
    background: rgba(212, 175, 55, 0.1);
  }

  .timeline-section {
    padding: 0.75rem 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .timeline-header h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1rem;
    margin: 0;
    color: #f8e5a8;
  }

  .timeline-subtitle {
    font-size: 0.85rem;
    color: #8a86a0;
  }

  .emotion-journey {
    margin-bottom: 0.75rem;
    padding: 0.6rem;
    background: rgba(212, 175, 55, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
  }

  .journey-label {
    font-size: 0.8rem;
    color: #d4af37;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .emotion-flow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .emotion-node {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 20px;
    color: #f8e5a8;
    font-weight: 500;
  }

  .emotion-arrow {
    color: #d4af37;
    opacity: 0.6;
  }

  .timeline-container {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 0.75rem;
    scroll-behavior: smooth;
  }

  .timeline-container::-webkit-scrollbar {
    height: 8px;
  }

  .timeline-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .timeline-container::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.3);
    border-radius: 4px;
  }

  .scene-card {
    min-width: 280px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .scene-card:hover {
    border-color: rgba(212, 175, 55, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }

  .scene-card.selected {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);
  }

  .scene-number {
    font-size: 0.85rem;
    color: #d4af37;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .scene-preview {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .scene-emotion,
  .scene-env {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #a8a4c0;
  }

  .scene-description {
    font-size: 0.9rem;
    line-height: 1.5;
    color: #c8c5d8;
  }

  .edit-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #d4af37;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(212, 175, 55, 0.1);
    border-radius: 4px;
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1rem 2rem 2rem;
  }

  .scene-detail {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .scene-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
    flex-shrink: 0;
    padding: 1rem 1rem 0.75rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .scene-detail-header h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.25rem;
    margin: 0;
    color: #f8e5a8;
  }

  .scene-meta {
    display: flex;
    gap: 0.5rem;
  }

  .emotion-tag,
  .env-tag {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .scene-detail-content {
    padding: 1rem;
  }

  .scene-visual-area {
    margin-bottom: 0.75rem;
    flex-shrink: 0;
  }

  .scene-visual-area img {
    width: 100%;
    height: auto;
    object-fit: contain;
  }

  .visual-placeholder {
    height: 320px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
    border: 2px dashed rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    text-align: center;
  }

  .visual-placeholder svg {
    color: #d4af37;
    opacity: 0.5;
  }

  .visual-prompt {
    font-size: 0.85rem;
    color: #a8a4c0;
    line-height: 1.4;
    font-style: italic;
    max-height: 80px;
    overflow-y: auto;
  }

  .visual-prompt-preview {
    font-size: 0.85rem;
    color: #a8a4c0;
    line-height: 1.5;
    font-style: italic;
    margin: 0;
  }

  .visual-prompt-text {
    font-size: 0.9rem;
    color: #c8c5d8;
    line-height: 1.6;
    margin: 0;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .visual-placeholder small {
    color: #6b6880;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .visual-placeholder svg {
    width: 40px;
    height: 40px;
  }

  .scene-info-section {
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .scene-info-section h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1rem;
    color: #d4af37;
    margin: 0 0 0.5rem 0;
  }

  .generate-image-button {
    width: 100%;
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #0f0c29;
    border: none;
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
  }

  .generate-image-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  }

  .generate-image-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
  }

  .scene-narrative {
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .scene-narrative h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1rem;
    color: #d4af37;
    margin: 0 0 0.5rem 0;
  }

  .scene-narrative p {
    line-height: 1.7;
    color: #c8c5d8;
    font-size: 0.95rem;
  }

  .edit-history {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    flex-shrink: 0;
  }

  .edit-history h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 0.95rem;
    color: #d4af37;
    margin: 0 0 0.5rem 0;
  }

  .edit-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
  }

  .edit-item svg {
    color: #d4af37;
    flex-shrink: 0;
  }

  .edit-type {
    margin-left: auto;
    font-size: 0.75rem;
    color: #8a86a0;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .editor-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    padding: 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.1);
  }

  .editor-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0;
    padding: 1rem 1rem 0.75rem;
    border-bottom: 2px solid rgba(212, 175, 55, 0.2);
    flex-shrink: 0;
  }

  .editor-header svg {
    color: #d4af37;
    width: 20px;
    height: 20px;
  }

  .editor-header h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.25rem;
    margin: 0;
    color: #f8e5a8;
  }

  .editor-content {
    padding: 1rem;
  }

  .character-canon {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .character-canon h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #d4af37;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .canon-traits {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .trait-tag {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    background: rgba(212, 175, 55, 0.2);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 6px;
    color: #f8e5a8;
  }

  .canon-note {
    font-size: 0.8rem;
    color: #a8a4c0;
    margin: 0;
    font-style: italic;
  }

  .edit-examples {
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .edit-examples h4 {
    font-size: 0.9rem;
    color: #a8a4c0;
    margin: 0 0 0.5rem 0;
  }

  .example-commands {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .example-cmd {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #c8c5d8;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .example-cmd:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(212, 175, 55, 0.3);
  }

  .example-cmd:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-input {
    background: rgba(212, 175, 55, 0.05);
    padding: 0.75rem;
    border-radius: 8px;
    border: 2px solid rgba(212, 175, 55, 0.2);
    flex-shrink: 0;
  }

  .editor-input textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(212, 175, 55, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
    color: #e8e6f0;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.9rem;
    resize: none;
    margin-bottom: 0.75rem;
    box-sizing: border-box;
    transition: all 0.3s ease;
    height: 80px;
  }

  .editor-input textarea:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  .editor-input textarea::placeholder {
    color: #8a86a0;
  }

  .execute-button {
    width: 100%;
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #0f0c29;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    font-family: 'Work Sans', sans-serif;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .execute-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
  }

  .execute-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
    box-shadow: none;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 3px solid rgba(15, 12, 41, 0.3);
    border-top-color: #0f0c29;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .system-message {
    position: fixed;
    top: 2rem;
    right: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    max-width: 400px;
  }

  .system-message.success {
    background: rgba(46, 204, 113, 0.2);
    border: 1px solid rgba(46, 204, 113, 0.5);
    color: #a8f5c7;
  }

  .system-message.error {
    background: rgba(231, 76, 60, 0.2);
    border: 1px solid rgba(231, 76, 60, 0.5);
    color: #ffb3b3;
  }

  .system-message.info {
    background: rgba(52, 152, 219, 0.2);
    border: 1px solid rgba(52, 152, 219, 0.5);
    color: #a8d8f5;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 1024px) {
    .main-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .app-title {
      font-size: 3rem;
    }
    .features-grid {
      grid-template-columns: 1fr;
    }
  }
`;
