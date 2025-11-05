import { Question, Subject, Difficulty } from './types';

// This is a sample question bank. In a real application, this would be much larger
// and could be loaded from a separate JSON file or an API.
export const QUESTION_BANK: Question[] = [
  // IMO Questions
  {
    id: 'imo_num_001',
    questionText: 'What is the sum of the first 10 prime numbers?',
    options: ['129', '100', '131', '127'],
    correctAnswerIndex: 0,
    explanation: 'The first 10 prime numbers are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29. Their sum is 2+3+5+7+11+13+17+19+23+29 = 129.',
    topic: 'Number Systems',
    subject: Subject.IMO,
    difficulty: 'Easy',
  },
  {
    id: 'imo_alg_001',
    questionText: 'If 3x - 7 = 5x + 5, what is the value of x?',
    options: ['-6', '6', '-1', '1'],
    correctAnswerIndex: 0,
    explanation: 'To solve for x, first subtract 3x from both sides: -7 = 2x + 5. Then, subtract 5 from both sides: -12 = 2x. Finally, divide by 2: x = -6.',
    topic: 'Algebra',
    subject: Subject.IMO,
    difficulty: 'Medium',
  },
  {
    id: 'imo_geo_001',
    questionText: 'In a triangle, two angles are 45° and 75°. What is the measure of the third angle?',
    options: ['50°', '60°', '70°', '80°'],
    correctAnswerIndex: 1,
    explanation: 'The sum of angles in a triangle is always 180°. So, the third angle is 180° - (45° + 75°) = 180° - 120° = 60°.',
    topic: 'Geometry',
    subject: Subject.IMO,
    difficulty: 'Easy',
  },
   {
    id: 'imo_geo_002_svg',
    questionText: 'What is the area of the shaded region in the figure, if the outer square has a side length of 10 cm and the inner square has a side length of 6 cm?',
    options: ['36 cm²', '64 cm²', '100 cm²', '40 cm²'],
    correctAnswerIndex: 1,
    explanation: 'Area of the outer square = 10 * 10 = 100 cm². Area of the inner square = 6 * 6 = 36 cm². The area of the shaded region is the difference between the two areas: 100 - 36 = 64 cm².',
    topic: 'Mensuration',
    subject: Subject.IMO,
    difficulty: 'Medium',
    imageSvg: '<svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 H100 V100 H0 Z" fill="#60a5fa" /><path d="M20 20 H80 V80 H20 Z" fill="white" /></svg>',
  },
  // NSO Questions
  {
    id: 'nso_phy_001',
    questionText: 'Which of the following is the SI unit of electric current?',
    options: ['Volt', 'Ohm', 'Ampere', 'Watt'],
    correctAnswerIndex: 2,
    explanation: 'The SI unit for measuring electric current is the Ampere (A). Volt is for voltage, Ohm for resistance, and Watt for power.',
    topic: 'Physics',
    subject: Subject.NSO,
    difficulty: 'Easy',
  },
  {
    id: 'nso_che_001',
    questionText: 'Which gas is most abundant in the Earth\'s atmosphere?',
    options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'],
    correctAnswerIndex: 3,
    explanation: 'The Earth\'s atmosphere is composed of about 78% nitrogen, 21% oxygen, 0.9% argon, 0.04% carbon dioxide, and trace amounts of other gases.',
    topic: 'Chemistry',
    subject: Subject.NSO,
    difficulty: 'Easy',
  },
  {
    id: 'nso_bio_001',
    questionText: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Cell Membrane'],
    correctAnswerIndex: 2,
    explanation: 'The mitochondrion is known as the powerhouse of the cell because it generates most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy.',
    topic: 'Biology',
    subject: Subject.NSO,
    difficulty: 'Medium',
  },
  {
    id: 'nso_phy_002',
    questionText: 'A car accelerates from rest to a speed of 20 m/s in 10 seconds. What is its acceleration?',
    options: ['2 m/s²', '0.5 m/s²', '200 m/s²', '5 m/s²'],
    correctAnswerIndex: 0,
    explanation: 'Acceleration is the change in velocity divided by time. a = (final velocity - initial velocity) / time. a = (20 m/s - 0 m/s) / 10 s = 2 m/s².',
    topic: 'Physics',
    subject: Subject.NSO,
    difficulty: 'Hard',
  }
];
