
export interface AIProvider {
  id: string;
  name: string;
  keyName: string;
}

export interface GeneratedQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
