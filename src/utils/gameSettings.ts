
// Game settings that are shared across components
// These would ideally come from a database in a real app

export const gameSettings = {
  questionDuration: 20, // seconds
  answerRevealDuration: 5, // seconds
  intermissionFrequency: 10, // show intermission after every 10 questions
  intermissionDuration: 8, // seconds
  leaderboardFrequency: 10, // show leaderboard after every 10 questions
  autoProgress: true, // automatically progress through questions
  showIntermission: true, // show intermission slides (new setting)
};

// Define a type for game settings to improve type safety
export type GameSettings = typeof gameSettings;

// Helper function to update a specific setting
export const updateGameSetting = (key: keyof GameSettings, value: number | boolean) => {
  if (key in gameSettings) {
    // Type assertion is safe here since we've checked that the key exists
    gameSettings[key] = value;
    // Store in localStorage for persistence
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    console.log(`Updated game setting: ${key} = ${value}`);
  }
};

// Initialize settings from localStorage if available
const initializeSettings = () => {
  const storedSettings = localStorage.getItem('gameSettings');
  if (storedSettings) {
    try {
      const parsedSettings = JSON.parse(storedSettings);
      Object.keys(parsedSettings).forEach(key => {
        if (key in gameSettings) {
          // Type assertion is safe here since we've checked that the key exists
          gameSettings[key as keyof GameSettings] = parsedSettings[key];
        }
      });
      console.log('Game settings loaded from storage:', gameSettings);
    } catch (error) {
      console.error('Error loading game settings from storage:', error);
    }
  }
};

// Run initialization
initializeSettings();
