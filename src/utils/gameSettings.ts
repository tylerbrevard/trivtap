
// Game settings that are shared across components
// These would ideally come from a database in a real app

export const gameSettings = {
  questionDuration: 20, // seconds
  answerRevealDuration: 5, // seconds
  intermissionFrequency: 10, // show intermission after every 10 questions (default)
  intermissionDuration: 8, // seconds
  leaderboardFrequency: 10, // show leaderboard after every 10 questions
};

// Helper function to update a specific setting
export const updateGameSetting = (key: keyof typeof gameSettings, value: number) => {
  if (key in gameSettings) {
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
          gameSettings[key as keyof typeof gameSettings] = parsedSettings[key];
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
