// Game settings that are shared across components
// These would ideally come from a database in a real app

// Define explicit type for our game settings first
export type GameSettings = {
  questionDuration: number;
  answerRevealDuration: number;
  intermissionFrequency: number;
  intermissionDuration: number;
  leaderboardFrequency: number;
  autoProgress: boolean;
  showIntermission: boolean;
  slideRotationTime: number;
  showWinnerSlide: boolean; // Added this property
};

// Create the settings object matching our type
export const gameSettings: GameSettings = {
  questionDuration: 20, // seconds
  answerRevealDuration: 5, // seconds
  intermissionFrequency: 5, // show intermission after every 5 questions by default (changed from 10)
  intermissionDuration: 30, // seconds - total duration of intermission (updated from 8 to 30)
  leaderboardFrequency: 10, // show leaderboard after every 10 questions
  autoProgress: true, // automatically progress through questions
  showIntermission: true, // show intermission slides
  slideRotationTime: 10, // seconds per slide rotation
  showWinnerSlide: true, // show winner leaderboard slide during intermission
};

// Helper function to update a specific setting
export const updateGameSetting = (key: keyof GameSettings, value: number | boolean) => {
  if (key in gameSettings) {
    // Now we can safely assign the value since we've checked that the key exists
    (gameSettings[key] as any) = value;
    // Store in localStorage for persistence
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    console.log(`Updated game setting: ${key} = ${value}`);
    
    // Dispatch event to notify other components of the change
    const event = new CustomEvent('gameSettingsChanged', { detail: { key, value } });
    window.dispatchEvent(event);
  }
};

// Initialize settings from localStorage if available
const initializeSettings = () => {
  const storedSettings = localStorage.getItem('gameSettings');
  if (storedSettings) {
    try {
      const parsedSettings = JSON.parse(storedSettings);
      
      // Log what we're loading for debugging purposes
      console.log('Loading game settings from storage:', parsedSettings);
      
      Object.keys(parsedSettings).forEach(key => {
        if (key in gameSettings) {
          // Now we can safely assign the parsed value
          (gameSettings[key as keyof GameSettings] as any) = parsedSettings[key];
        }
      });
      console.log('Game settings after loading:', gameSettings);
    } catch (error) {
      console.error('Error loading game settings from storage:', error);
    }
  }
};

// Listen for settings changes
window.addEventListener('gameSettingsChanged', (e: Event) => {
  console.log('Game settings changed event detected', (e as CustomEvent).detail);
  // This allows components to react to settings changes without reloading
});

// Run initialization
initializeSettings();
