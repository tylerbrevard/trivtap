import { supabase } from "@/integrations/supabase/client";

export interface StaticQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export const baseStaticQuestions: StaticQuestion[] = [
  {
    id: '1',
    text: 'What is the capital of France?',
    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
    correctAnswer: 'Paris',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '2',
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    category: 'Math',
    difficulty: 'easy',
  },
  {
    id: '3',
    text: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
    correctAnswer: 'Mars',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '4',
    text: 'Who wrote Hamlet?',
    options: ['Shakespeare', 'Dickens', 'Austen', 'Chaucer'],
    correctAnswer: 'Shakespeare',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '5',
    text: 'What year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: '1945',
    category: 'History',
    difficulty: 'hard',
  },
  {
    id: '6',
    text: 'What is the chemical symbol for gold?',
    options: ['Au', 'Ag', 'Fe', 'Cu'],
    correctAnswer: 'Au',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '7',
    text: 'Which country is known as the Land of the Rising Sun?',
    options: ['China', 'South Korea', 'Japan', 'Vietnam'],
    correctAnswer: 'Japan',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '8',
    text: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
    correctAnswer: 'Leonardo da Vinci',
    category: 'Art',
    difficulty: 'medium',
  },
  {
    id: '9',
    text: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 'Pacific',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '10',
    text: 'In what year did the Titanic sink?',
    options: ['1910', '1912', '1914', '1916'],
    correctAnswer: '1912',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '11',
    text: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 'Canberra',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '12',
    text: 'What is the value of pi (π) to two decimal places?',
    options: ['3.14', '3.16', '3.12', '3.18'],
    correctAnswer: '3.14',
    category: 'Math',
    difficulty: 'easy',
  },
  {
    id: '13',
    text: 'Which gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
    correctAnswer: 'Carbon Dioxide',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '14',
    text: 'Who is the author of "Pride and Prejudice"?',
    options: ['Jane Austen', 'Charlotte Brontë', 'Emily Brontë', 'Louisa May Alcott'],
    correctAnswer: 'Jane Austen',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '15',
    text: 'What is the currency of Japan?',
    options: ['Yuan', 'Won', 'Ringgit', 'Yen'],
    correctAnswer: 'Yen',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '16',
    text: 'What is the largest planet in our solar system?',
    options: ['Earth', 'Mars', 'Saturn', 'Jupiter'],
    correctAnswer: 'Jupiter',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '17',
    text: 'Who developed the theory of relativity?',
    options: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Stephen Hawking'],
    correctAnswer: 'Albert Einstein',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '18',
    text: 'Which famous scientist formulated the laws of motion and universal gravitation?',
    options: ['Marie Curie', 'Isaac Newton', 'Albert Einstein', 'Nikola Tesla'],
    correctAnswer: 'Isaac Newton',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '19',
    text: 'What is the chemical symbol for water?',
    options: ['H2O', 'CO2', 'NaCl', 'O2'],
    correctAnswer: 'H2O',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '20',
    text: 'Which gas do humans breathe in from the atmosphere?',
    options: ['Carbon Dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'],
    correctAnswer: 'Oxygen',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '21',
    text: 'What is the smallest country in the world?',
    options: ['Monaco', 'Nauru', 'San Marino', 'Vatican City'],
    correctAnswer: 'Vatican City',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '22',
    text: 'Which mountain is the highest above sea level?',
    options: ['Mount Kilimanjaro', 'Mount Everest', 'Mount McKinley', 'Mount Fuji'],
    correctAnswer: 'Mount Everest',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '23',
    text: 'What is the capital city of Canada?',
    options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
    correctAnswer: 'Ottawa',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '24',
    text: 'Which river is the longest in the world?',
    options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
    correctAnswer: 'Nile',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '25',
    text: 'What is the name of the largest desert in the world?',
    options: ['Sahara', 'Arctic', 'Antarctic', 'Arabian'],
    correctAnswer: 'Antarctic',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '26',
    text: 'What is 12 x 12?',
    options: ['144', '124', '134', '154'],
    correctAnswer: '144',
    category: 'Math',
    difficulty: 'easy',
  },
  {
    id: '27',
    text: 'Solve for x: 2x + 5 = 15',
    options: ['x = 10', 'x = 5', 'x = 20', 'x = 2'],
    correctAnswer: 'x = 5',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '28',
    text: 'What is the square root of 81?',
    options: ['7', '8', '9', '10'],
    correctAnswer: '9',
    category: 'Math',
    difficulty: 'easy',
  },
  {
    id: '29',
    text: 'If a train travels 120 miles in 2 hours, what is its average speed?',
    options: ['40 mph', '50 mph', '60 mph', '70 mph'],
    correctAnswer: '60 mph',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '30',
    text: 'What is the area of a circle with a radius of 5 units? (Use π = 3.14)',
    options: ['78.5', '31.4', '15.7', '157'],
    correctAnswer: '78.5',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '31',
    text: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 'William Shakespeare',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '32',
    text: 'Which novel opens with the line, "It is a truth universally acknowledged..."?',
    options: ['Pride and Prejudice', 'Jane Eyre', 'Emma', 'Sense and Sensibility'],
    correctAnswer: 'Pride and Prejudice',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '33',
    text: 'Who is the author of "To Kill a Mockingbird"?',
    options: ['Harper Lee', 'George Orwell', 'J.D. Salinger', 'F. Scott Fitzgerald'],
    correctAnswer: 'Harper Lee',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '34',
    text: 'Which book features the character Jay Gatsby?',
    options: ['The Catcher in the Rye', 'The Great Gatsby', 'A Farewell to Arms', 'Brave New World'],
    correctAnswer: 'The Great Gatsby',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '35',
    text: 'Who wrote "1984"?',
    options: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'Ernest Hemingway'],
    correctAnswer: 'George Orwell',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '36',
    text: 'In which year did the French Revolution begin?',
    options: ['1776', '1789', '1804', '1815'],
    correctAnswer: '1789',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '37',
    text: 'Who was the first President of the United States?',
    options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'],
    correctAnswer: 'George Washington',
    category: 'History',
    difficulty: 'easy',
  },
  {
    id: '38',
    text: 'Which war is known as "The War to End All Wars"?',
    options: ['World War I', 'World War II', 'The Civil War', 'The Cold War'],
    correctAnswer: 'World War I',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '39',
    text: 'Who was the leader of the Soviet Union during World War II?',
    options: ['Vladimir Lenin', 'Leon Trotsky', 'Joseph Stalin', 'Nikita Khrushchev'],
    correctAnswer: 'Joseph Stalin',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '40',
    text: 'In what year did the Berlin Wall fall?',
    options: ['1985', '1989', '1991', '1995'],
    correctAnswer: '1989',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '41',
    text: 'What is the chemical symbol for oxygen?',
    options: ['O', 'Ox', 'O2', 'Og'],
    correctAnswer: 'O',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '42',
    text: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Mars', 'Mercury', 'Earth'],
    correctAnswer: 'Mercury',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '43',
    text: 'What is the speed of light in a vacuum?',
    options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '200,000 km/s'],
    correctAnswer: '300,000 km/s',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '44',
    text: 'What is the hardest natural substance on Earth?',
    options: ['Iron', 'Diamond', 'Gold', 'Quartz'],
    correctAnswer: 'Diamond',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '45',
    text: 'Which element has the atomic number 1?',
    options: ['Oxygen', 'Hydrogen', 'Helium', 'Carbon'],
    correctAnswer: 'Hydrogen',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '46',
    text: 'What is the capital of Italy?',
    options: ['Milan', 'Venice', 'Rome', 'Naples'],
    correctAnswer: 'Rome',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '47',
    text: 'Which country is home to the Eiffel Tower?',
    options: ['Spain', 'Italy', 'Germany', 'France'],
    correctAnswer: 'France',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '48',
    text: 'What is the name of the sea between Europe and Africa?',
    options: ['Atlantic Ocean', 'Mediterranean Sea', 'Indian Ocean', 'Arctic Sea'],
    correctAnswer: 'Mediterranean Sea',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '49',
    text: 'Which continent is known as the "Land Down Under"?',
    options: ['Africa', 'South America', 'Australia', 'Antarctica'],
    correctAnswer: 'Australia',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '50',
    text: 'What is the capital of Brazil?',
    options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'],
    correctAnswer: 'Brasília',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '51',
    text: 'Solve for x: 3x - 7 = 14',
    options: ['x = 3', 'x = 7', 'x = 21', 'x = 14'],
    correctAnswer: 'x = 7',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '52',
    text: 'What is the value of 7! (7 factorial)?',
    options: ['5040', '720', '120', '362880'],
    correctAnswer: '5040',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '53',
    text: 'If a rectangle has a length of 8 units and a width of 6 units, what is its area?',
    options: ['14', '28', '48', '56'],
    correctAnswer: '48',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '54',
    text: 'What is the next number in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, ?',
    options: ['10', '11', '12', '13'],
    correctAnswer: '13',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '55',
    text: 'What is the result of 25 ÷ 0?',
    options: ['0', '25', 'Undefined', '1'],
    correctAnswer: 'Undefined',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '56',
    text: 'Who wrote "The Odyssey"?',
    options: ['Homer', 'Virgil', 'Sophocles', 'Plato'],
    correctAnswer: 'Homer',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '57',
    text: 'Which play features the character Hamlet?',
    options: ['Macbeth', 'Othello', 'Hamlet', 'King Lear'],
    correctAnswer: 'Hamlet',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '58',
    text: 'Who is the author of "The Lord of the Rings"?',
    options: ['J.K. Rowling', 'C.S. Lewis', 'J.R.R. Tolkien', 'George R.R. Martin'],
    correctAnswer: 'J.R.R. Tolkien',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '59',
    text: 'Which novel is set in the fictional town of Maycomb, Alabama?',
    options: ['The Color Purple', 'Beloved', 'To Kill a Mockingbird', 'The Help'],
    correctAnswer: 'To Kill a Mockingbird',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '60',
    text: 'Who wrote "The Divine Comedy"?',
    options: ['Geoffrey Chaucer', 'Dante Alighieri', 'Giovanni Boccaccio', 'Francesco Petrarch'],
    correctAnswer: 'Dante Alighieri',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '61',
    text: 'In which year did the United States declare independence?',
    options: ['1775', '1776', '1783', '1789'],
    correctAnswer: '1776',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '62',
    text: 'Who was the Queen of England during the Elizabethan era?',
    options: ['Queen Victoria', 'Queen Mary I', 'Queen Elizabeth I', 'Queen Anne'],
    correctAnswer: 'Queen Elizabeth I',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '63',
    text: 'Which event marked the beginning of World War II?',
    options: ['Invasion of Poland', 'Attack on Pearl Harbor', 'Battle of Stalingrad', 'Signing of the Treaty of Versailles'],
    correctAnswer: 'Invasion of Poland',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '64',
    text: 'Who led the civil rights movement in the United States during the 1950s and 1960s?',
    options: ['Malcolm X', 'Rosa Parks', 'Martin Luther King Jr.', 'Nelson Mandela'],
    correctAnswer: 'Martin Luther King Jr.',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '65',
    text: 'In what year did the Cold War officially end?',
    options: ['1985', '1989', '1991', '1995'],
    correctAnswer: '1991',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '66',
    text: 'What is the chemical symbol for nitrogen?',
    options: ['Ni', 'Ne', 'Na', 'N'],
    correctAnswer: 'N',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '67',
    text: 'Which planet is known as the "Morning Star" or "Evening Star"?',
    options: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    correctAnswer: 'Venus',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '68',
    text: 'What force keeps planets in orbit around the Sun?',
    options: ['Electromagnetism', 'Gravity', 'Nuclear Force', 'Friction'],
    correctAnswer: 'Gravity',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '69',
    text: 'What is the name for a group of stars that form a recognizable pattern?',
    options: ['Galaxy', 'Nebula', 'Constellation', 'Asteroid'],
    correctAnswer: 'Constellation',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '70',
    text: 'Which scientist is famous for his work on radioactivity?',
    options: ['Isaac Newton', 'Marie Curie', 'Albert Einstein', 'Nikola Tesla'],
    correctAnswer: 'Marie Curie',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '71',
    text: 'What is the capital of Spain?',
    options: ['Barcelona', 'Seville', 'Madrid', 'Valencia'],
    correctAnswer: 'Madrid',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '72',
    text: 'Which country is known for the Great Barrier Reef?',
    options: ['Brazil', 'Australia', 'Indonesia', 'Mexico'],
    correctAnswer: 'Australia',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '73',
    text: 'What is the name of the mountain range that separates Europe from Asia?',
    options: ['Alps', 'Pyrenees', 'Ural Mountains', 'Rocky Mountains'],
    correctAnswer: 'Ural Mountains',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '74',
    text: 'Which river flows through Egypt?',
    options: ['Amazon', 'Nile', 'Congo', 'Mississippi'],
    correctAnswer: 'Nile',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '75',
    text: 'What is the largest island in the world?',
    options: ['Greenland', 'New Guinea', 'Borneo', 'Madagascar'],
    correctAnswer: 'Greenland',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '76',
    text: 'What is 15% of 200?',
    options: ['15', '20', '30', '40'],
    correctAnswer: '30',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '77',
    text: 'If a shirt costs $25 and is on sale for 20% off, what is the sale price?',
    options: ['$5', '$15', '$20', '$25'],
    correctAnswer: '$20',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '78',
    text: 'What is the area of a triangle with a base of 10 units and a height of 7 units?',
    options: ['17', '35', '70', '140'],
    correctAnswer: '35',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '79',
    text: 'What is the value of x in the equation 4x + 8 = 20?',
    options: ['2', '3', '4', '5'],
    correctAnswer: '3',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '80',
    text: 'What is the perimeter of a square with sides of 9 units?',
    options: ['18', '27', '36', '81'],
    correctAnswer: '36',
    category: 'Math',
    difficulty: 'medium',
  },
  {
    id: '81',
    text: 'Who wrote "The Canterbury Tales"?',
    options: ['Geoffrey Chaucer', 'William Langland', 'John Milton', 'Edmund Spenser'],
    correctAnswer: 'Geoffrey Chaucer',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '82',
    text: 'Which Shakespearean play features the character Othello?',
    options: ['Hamlet', 'Macbeth', 'Othello', 'King Lear'],
    correctAnswer: 'Othello',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '83',
    text: 'Who is the author of "One Hundred Years of Solitude"?',
    options: ['Gabriel Garcia Marquez', 'Mario Vargas Llosa', 'Jorge Luis Borges', 'Isabel Allende'],
    correctAnswer: 'Gabriel Garcia Marquez',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '84',
    text: 'Which novel tells the story of the Pevensie children in a magical land?',
    options: ['The Hobbit', 'The Chronicles of Narnia', 'Alice\'s Adventures in Wonderland', 'A Wrinkle in Time'],
    correctAnswer: 'The Chronicles of Narnia',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '85',
    text: 'Who wrote "Don Quixote"?',
    options: ['Miguel de Cervantes', 'Lope de Vega', 'Pedro Calderón de la Barca', 'Tirso de Molina'],
    correctAnswer: 'Miguel de Cervantes',
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    id: '86',
    text: 'In which year did the American Civil War begin?',
    options: ['1850', '1861', '1865', '1870'],
    correctAnswer: '1861',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '87',
    text: 'Who was the first woman to fly solo across the Atlantic Ocean?',
    options: ['Bessie Coleman', 'Harriet Quimby', 'Amelia Earhart', 'Jacqueline Cochran'],
    correctAnswer: 'Amelia Earhart',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '88',
    text: 'Which event is considered the start of the Great Depression?',
    options: ['Black Tuesday', 'Dust Bowl', 'New Deal', 'Smoot-Hawley Tariff Act'],
    correctAnswer: 'Black Tuesday',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '89',
    text: 'Who was the leader of Nazi Germany during World War II?',
    options: ['Benito Mussolini', 'Hideki Tojo', 'Adolf Hitler', 'Francisco Franco'],
    correctAnswer: 'Adolf Hitler',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '90',
    text: 'In what year did the Soviet Union collapse?',
    options: ['1985', '1989', '1991', '1995'],
    correctAnswer: '1991',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: '91',
    text: 'What is the chemical symbol for potassium?',
    options: ['Po', 'P', 'K', 'Pt'],
    correctAnswer: 'K',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '92',
    text: 'Which planet is known for its prominent rings?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correctAnswer: 'Saturn',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: '93',
    text: 'What is the process by which plants convert light energy into chemical energy?',
    options: ['Respiration', 'Photosynthesis', 'Transpiration', 'Fermentation'],
    correctAnswer: 'Photosynthesis',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '94',
    text: 'What is the name for the phenomenon where a liquid turns into a gas?',
    options: ['Condensation', 'Sublimation', 'Evaporation', 'Precipitation'],
    correctAnswer: 'Evaporation',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '95',
    text: 'Which scientist is known for his laws of thermodynamics?',
    options: ['James Clerk Maxwell', 'Lord Kelvin', 'Sadi Carnot', 'Rudolf Clausius'],
    correctAnswer: 'Lord Kelvin',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: '96',
    text: 'What is the capital of Germany?',
    options: ['Munich', 'Hamburg', 'Berlin', 'Cologne'],
    correctAnswer: 'Berlin',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '97',
    text: 'Which country is known for kangaroos?',
    options: ['South Africa', 'Argentina', 'Australia', 'India'],
    correctAnswer: 'Australia',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: '98',
    text: 'What is the name of the largest rainforest in the world?',
    options: ['Congo Rainforest', 'Amazon Rainforest', 'Southeast Asian Rainforest', 'Daintree Rainforest'],
    correctAnswer: 'Amazon Rainforest',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '99',
    text: 'Which sea is located between Greece and Turkey?',
    options: ['Adriatic Sea', 'Black Sea', 'Aegean Sea', 'Caspian Sea'],
    correctAnswer: 'Aegean Sea',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: '100',
    text: 'What is the capital of Argentina?',
    options: ['Rio de Janeiro', 'Santiago', 'Buenos Aires', 'Lima'],
    correctAnswer: 'Buenos Aires',
    category: 'Geography',
    difficulty: 'medium',
  },
];

/**
 * Gets imported questions from Supabase
 * @returns Imported questions from Supabase
 */
export const getImportedQuestions = async (): Promise<StaticQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        options,
        correct_answer,
        categories:category_id (
          name
        )
      `);
    
    if (error) {
      console.error('Error fetching imported questions:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No imported questions found in Supabase');
      return [];
    }
    
    const formattedQuestions = data.map(question => {
      let options: string[] = [];
      if (question.options) {
        if (Array.isArray(question.options)) {
          options = question.options.map(opt => String(opt));
        } else if (typeof question.options === 'string') {
          try {
            const parsedOptions = JSON.parse(question.options);
            options = Array.isArray(parsedOptions) ? parsedOptions.map(opt => String(opt)) : [];
          } catch {
            options = [String(question.options)];
          }
        }
      }
      
      return {
        id: question.id,
        text: question.text,
        options: options,
        correctAnswer: question.correct_answer,
        category: question.categories ? question.categories.name : 'Imported',
        difficulty: 'medium' as 'easy' | 'medium' | 'hard'
      };
    });
    
    console.log(`Loaded ${formattedQuestions.length} imported questions from Supabase`);
    return formattedQuestions;
  } catch (error) {
    console.error('Error in getImportedQuestions:', error);
    return [];
  }
};

/**
 * Gets user-specific questions from Supabase
 * @returns User-specific questions from Supabase
 */
export const getUserQuestions = async (): Promise<StaticQuestion[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user?.id) {
      console.log('No user session found, skipping user-specific questions');
      return [];
    }
    
    const userId = session.session.user.id;
    
    // Check if the questions table exists
    const { error: tableCheckError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
      
    // If there's an error accessing the questions table, return empty array
    if (tableCheckError) {
      console.log('Error checking for questions table:', tableCheckError);
      return [];
    }
    
    // Simplify types by using any for the data returned from Supabase
    const { data, error } = await supabase
      .from('questions')
      .select('id, text, options, correct_answer, category_id, difficulty');
      
    if (error) {
      console.error('Error fetching user questions:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No user-specific questions found in Supabase');
      return [];
    }
    
    // Get categories separately
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');
    
    // Create a simple object for category lookup
    const categoryMap: Record<string, string> = {};
    if (categories) {
      categories.forEach((category: any) => {
        categoryMap[category.id] = category.name;
      });
    }
    
    // Type the question as any to avoid deep type instantiation
    const formattedQuestions: StaticQuestion[] = data.map((question: any) => {
      let options: string[] = [];
      
      if (question.options) {
        if (Array.isArray(question.options)) {
          options = question.options.map((opt: any) => String(opt));
        } else if (typeof question.options === 'string') {
          try {
            const parsedOptions = JSON.parse(question.options);
            options = Array.isArray(parsedOptions) ? parsedOptions.map((opt: any) => String(opt)) : [];
          } catch {
            options = [String(question.options)];
          }
        }
      }
      
      return {
        id: question.id,
        text: question.text,
        options: options,
        correctAnswer: question.correct_answer,
        category: question.category_id && categoryMap[question.category_id] 
          ? categoryMap[question.category_id] 
          : 'User',
        difficulty: (question.difficulty || 'medium') as 'easy' | 'medium' | 'hard'
      };
    });
    
    console.log(`Loaded ${formattedQuestions.length} user-specific questions from Supabase`);
    return formattedQuestions;
  } catch (error) {
    console.error('Error in getUserQuestions:', error);
    return [];
  }
};

/**
 * Gets the current user ID from Supabase session
 * @returns Current user ID or undefined if not logged in
 */
export const getCurrentUserId = async (): Promise<string | undefined> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    return session?.session?.user?.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return undefined;
  }
};

/**
 * Gets questions from localStorage for the current user
 * @param userId Optional user ID, if not provided will use the default storage key
 * @returns Questions from localStorage
 */
export const getLocalStorageQuestions = (userId?: string): StaticQuestion[] => {
  try {
    const storageKey = userId || 'default';
    const existingDataString = localStorage.getItem('trivia_questions');
    
    if (!existingDataString) {
      return [];
    }
    
    const existingData = JSON.parse(existingDataString);
    return existingData[storageKey] || [];
  } catch (error) {
    console.error('Error getting questions from localStorage:', error);
    return [];
  }
};

/**
 * Gets all static questions from various sources
 * @returns Combined questions from all sources
 */
export const getStaticQuestions = async (): Promise<StaticQuestion[]> => {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    
    // Get default questions
    const defaultQuestions = getLocalStorageQuestions('default');
    
    // If default questions are empty, use the base static questions
    const baseQuestions = defaultQuestions.length > 0 ? defaultQuestions : baseStaticQuestions;
    
    // Get user-specific questions from localStorage
    const userQuestions = userId ? getLocalStorageQuestions(userId) : [];
    
    // Get imported questions
    const importedQuestions = await getImportedQuestions();
    
    // Get user-specific questions from Supabase
    const supabaseUserQuestions = await getUserQuestions();
    
    // Combine all questions
    const allQuestions = [
      ...baseQuestions,
      ...userQuestions,
      ...importedQuestions,
      ...supabaseUserQuestions
    ];
    
    console.log(`Total questions loaded: ${allQuestions.length}`);
    return allQuestions;
  } catch (error) {
    console.error('Error getting static questions:', error);
    // Fallback to base static questions
    return baseStaticQuestions;
  }
};

/**
 * Export questions to JSON format
 * @returns JSON string of all questions
 */
export const exportQuestionsToJson = async (): Promise<string> => {
  try {
    const allQuestions = await getStaticQuestions();
    
    return JSON.stringify(allQuestions, null, 2);
  } catch (error) {
    console.error('Error exporting questions to JSON:', error);
    throw new Error('Failed to export questions');
  }
};

/**
 * Export questions to CSV format
 * @returns CSV string of all questions
 */
export const exportQuestionsToCSV = async (): Promise<string> => {
  try {
    const allQuestions = await getStaticQuestions();
    const csvRows = [];
    
    // Add header row
    csvRows.push('question,category,option1,option2,option3,option4,correctAnswer,difficulty');
    
    // Add data rows
    allQuestions.forEach(question => {
      const options = [...question.options];
      
      // Fill options array with empty strings if not enough options
      while (options.length < 4) {
        options.push('');
      }
      
      // Escape commas in all fields
      const escapedQuestion = question.text.replace(/,/g, '\\,');
      const escapedCategory = question.category.replace(/,/g, '\\,');
      const escapedOptions = options.map(opt => opt.replace(/,/g, '\\,'));
      const escapedCorrectAnswer = question.correctAnswer.replace(/,/g, '\\,');
      
      // Create and add the CSV row
      csvRows.push(
        `${escapedQuestion},${escapedCategory},${escapedOptions[0]},${escapedOptions[1]},${escapedOptions[2]},${escapedOptions[3]},${escapedCorrectAnswer},${question.difficulty}`
      );
    });
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('Error exporting questions to CSV:', error);
    throw new Error('Failed to export questions to CSV');
  }
};

/**
 * Add imported questions to the collection
 * @param questions Questions to add
 * @returns Result message
 */
export const addImportedQuestionsToCollection = async (questions: any[]): Promise<string> => {
  try {
    if (!questions || questions.length === 0) {
      throw new Error('No questions to import');
    }
    
    const userId = await getCurrentUserId();
    
    // Format questions to StaticQuestion format
    const formattedQuestions: StaticQuestion[] = questions.map((q, index) => {
      const questionText = q.question || q.text;
      const category = q.category || 'Imported';
      const options = q.options || [];
      const correctAnswer = q.correctAnswer || q.correct_answer;
      const difficulty = q.difficulty || 'medium';
      
      if (!questionText) {
        throw new Error(`Question at index ${index} is missing text`);
      }
      
      if (!options || options.length < 2) {
        throw new Error(`Question "${questionText}" has fewer than 2 options`);
      }
      
      if (!correctAnswer) {
        throw new Error(`Question "${questionText}" is missing a correct answer`);
      }
      
      if (!options.includes(correctAnswer)) {
        throw new Error(`Question "${questionText}" has a correct answer that is not in the options`);
      }
      
      return {
        id: `imported_${Date.now()}_${index}`,
        text: questionText,
        category,
        options,
        correctAnswer,
        difficulty: (['easy', 'medium', 'hard'].includes(difficulty.toLowerCase()) 
          ? difficulty.toLowerCase() 
          : 'medium') as 'easy' | 'medium' | 'hard'
      };
    });
    
    // Get existing questions
    const existingDataString = localStorage.getItem('trivia_questions');
    let existingData: Record<string, any[]> = {};
    
    if (existingDataString) {
      existingData = JSON.parse(existingDataString);
    }
    
    // Key to store questions under: either user ID or 'default' for unauthenticated users
    const storageKey = userId || 'default';
    
    // Initialize the array for this key if it doesn't exist
    if (!existingData[storageKey]) {
      existingData[storageKey] = [];
    }
    
    // Add the new questions to the existing array
    existingData[storageKey] = [...existingData[storageKey], ...formattedQuestions];
    
    // Save back to localStorage
    localStorage.setItem('trivia_questions', JSON.stringify(existingData));
    
    return `Successfully imported ${formattedQuestions.length} questions`;
  } catch (error) {
    console.error('Error adding imported questions to collection:', error);
    throw error;
  }
};

/**
 * Remove a question from the collection
 * @param questionId ID of the question to remove
 * @returns true if successful, false if not found
 */
export const removeQuestionFromCollection = async (questionId: string): Promise<boolean> => {
  try {
    if (!questionId) {
      throw new Error('No question ID provided');
    }
    
    const userId = await getCurrentUserId();
    
    // Get existing questions
    const existingDataString = localStorage.getItem('trivia_questions');
    
    if (!existingDataString) {
      return false;
    }
    
    let existingData = JSON.parse(existingDataString);
    
    // Check default questions
    if (existingData['default']) {
      const defaultIndex = existingData['default'].findIndex((q: any) => q.id === questionId);
      if (defaultIndex >= 0) {
        existingData['default'].splice(defaultIndex, 1);
        localStorage.setItem('trivia_questions', JSON.stringify(existingData));
        return true;
      }
    }
    
    // Check user questions
    if (userId && existingData[userId]) {
      const userIndex = existingData[userId].findIndex((q: any) => q.id === questionId);
      if (userIndex >= 0) {
        existingData[userId].splice(userIndex, 1);
        localStorage.setItem('trivia_questions', JSON.stringify(existingData));
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error removing question from collection:', error);
    throw error;
  }
};

/**
 * Get all available questions (including default and user-specific)
 * @param userId Optional user ID, if not provided will use the current user
 * @returns All available questions
 */
export const getAllAvailableQuestions = async (userId?: string): Promise<StaticQuestion[]> => {
  try {
    // If no userId provided, get the current user ID
    const currentUserId = userId || await getCurrentUserId();
    
    // Get existing questions from localStorage
    const existingDataString = localStorage.getItem('trivia_questions');
    if (!existingDataString) {
      return baseStaticQuestions;
    }
    
    const existingData = JSON.parse(existingDataString);
    
    // Always include default questions
    let allQuestions = [...(existingData['default'] || baseStaticQuestions)];
    
    // Add user-specific questions if user is logged in
    if (currentUserId && existingData[currentUserId]) {
      allQuestions = [...allQuestions, ...existingData[currentUserId]];
    }
    
    return allQuestions;
  } catch (error) {
    console.error('Error retrieving all available questions:', error);
    return baseStaticQuestions;
  }
};

/**
 * Gets a random subset of questions from all available questions
 * @param count Number of questions to get
 * @returns Random questions
 */
export const getRandomQuestions = async (count: number = 15): Promise<StaticQuestion[]> => {
  try {
    const allQuestions = await getAllAvailableQuestions();
    
    if (allQuestions.length <= count) {
      return allQuestions;
    }
    
    // Shuffle array and take the first 'count' elements
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error getting random questions:', error);
    return baseStaticQuestions.slice(0, count);
  }
};

/**
 * Format questions for game display with timer settings
 * @param questions Questions to format
 * @param defaultTimeLimit Default time limit per question
 * @returns Formatted questions
 */
export const formatQuestionsForGame = (
  questions: StaticQuestion[],
  defaultTimeLimit: number = 20
): StaticQuestion[] => {
  return questions.map(question => ({
    ...question,
    timeLimit: question.timeLimit || defaultTimeLimit
  }));
};
