/**
 * Example quiz structures for testing and documentation
 */

import {
  Question,
  QuestionType,
  MultipleChoiceQuestion,
  OpenEndedQuestion,
} from '../types/question.types';

/**
 * Example multiple-choice question
 */
export const exampleMultipleChoice: MultipleChoiceQuestion = {
  id: 'mc-1',
  type: QuestionType.MULTIPLE_CHOICE,
  question: 'What is the primary function of define-data-var in Clarity?',
  codeSnippet: '(define-data-var my-var uint u10)',
  options: [
    {
      id: 'a',
      text: 'To create a constant variable that cannot be changed.',
    },
    {
      id: 'b',
      text: 'To define a global state variable that can be updated.',
    },
    {
      id: 'c',
      text: 'To define a private function within the contract.',
    },
    {
      id: 'd',
      text: 'To define a new custom token type.',
    },
  ],
  correctOptionId: 'b',
  explanation:
    'define-data-var is used to declare a data variable in a Clarity smart contract. This variable is persisted in the blockchain state and can be mutated using var-set and read using var-get.',
};

/**
 * Example open-ended question
 */
export const exampleOpenEnded: OpenEndedQuestion = {
  id: 'oe-1',
  type: QuestionType.OPEN_ENDED,
  question:
    'Explain the difference between var, let, and const in terms of scoping and hoisting.',
  modelAnswer: `The key differences are:

1. Scope: var is function-scoped, while let and const are block-scoped. This means var is accessible throughout the entire function, while let and const are only accessible within the block they're defined in.

2. Hoisting: All three are hoisted, but differently. var is hoisted and initialized as undefined. let and const are hoisted but remain in a "Temporal Dead Zone" until their declaration is reached, causing a ReferenceError if accessed before declaration.

3. Reassignment: var and let can be reassigned to new values, while const cannot be reassigned (though objects/arrays declared with const can have their properties/elements modified).`,
  explanation: `A complete answer should cover:
- Scope differences (function vs block)
- Hoisting behavior and Temporal Dead Zone
- Reassignment capabilities
- Practical implications for code organization`,
};

/**
 * Example mixed quiz
 */
export const exampleMixedQuiz: Question[] = [
  {
    id: 'q1',
    type: QuestionType.MULTIPLE_CHOICE,
    question: 'What will this Clarity code return?',
    codeSnippet: `(define-read-only (get-magic-number)
  (+ u10 u5))`,
    options: [
      { id: 'a', text: 'An error, because uints cannot be added.' },
      { id: 'b', text: '15' },
      { id: 'c', text: '(ok u15)' },
      { id: 'd', text: 'u15' },
    ],
    correctOptionId: 'd',
    explanation:
      'The + function adds the two unsigned integers (u10 and u5) resulting in u15. Because it is a define-read-only and not a public function, it does not implicitly wrap the response in an (ok ...) or (err ...) tuple type.',
  },
  {
    id: 'q2',
    type: QuestionType.OPEN_ENDED,
    question:
      'Explain the purpose of the Proof of Transfer (PoX) consensus mechanism in Stacks.',
    modelAnswer:
      'Proof of Transfer (PoX) is the consensus mechanism used by Stacks that connects to Bitcoin. Miners commit Bitcoin to participate in leader election, and those BTC are transferred to STX holders who participate in Stacking. This creates a direct connection to Bitcoin security while enabling smart contracts and faster transactions on Stacks.',
    explanation:
      'Key points: Bitcoin connection, miner commitment, STX holder rewards, security inheritance, smart contract enablement.',
  },
  {
    id: 'q3',
    type: QuestionType.MULTIPLE_CHOICE,
    question: 'Which function is used to read a data variable in Clarity?',
    options: [
      { id: 'a', text: 'var-get' },
      { id: 'b', text: 'get-var' },
      { id: 'c', text: 'read-var' },
      { id: 'd', text: 'fetch-var' },
    ],
    correctOptionId: 'a',
    explanation:
      'var-get is the correct function to read the value of a data variable defined with define-data-var.',
  },
  {
    id: 'q4',
    type: QuestionType.OPEN_ENDED,
    question:
      'What are the benefits of building on Stacks compared to building directly on Bitcoin?',
    modelAnswer:
      'Building on Stacks provides several advantages: 1) Smart contract capabilities that Bitcoin lacks natively, 2) Faster transaction finality (Stacks blocks vs Bitcoin blocks), 3) Lower transaction costs for complex operations, 4) Access to the Clarity programming language with its safety features, 5) Ability to read Bitcoin state and react to Bitcoin transactions, while still inheriting Bitcoin security through PoX.',
    explanation:
      'Should mention: smart contracts, speed, cost, Clarity benefits, Bitcoin integration, security inheritance.',
  },
  {
    id: 'q5',
    type: QuestionType.MULTIPLE_CHOICE,
    question: 'What does the "principal" type represent in Clarity?',
    options: [
      { id: 'a', text: 'A numeric value representing importance' },
      { id: 'b', text: 'An address that can own assets' },
      { id: 'c', text: 'The main function in a contract' },
      { id: 'd', text: 'A boolean flag for permissions' },
    ],
    correctOptionId: 'b',
    explanation:
      'In Clarity, a principal is a type that represents an entity that can own assets. It can be either a standard principal (user address) or a contract principal (smart contract address).',
  },
];

/**
 * Example answer submission for multiple-choice quiz
 */
export const exampleMultipleChoiceAnswers = {
  q1: 'a',
  q2: 'b',
  q3: 'c',
  q4: 'd',
  q5: 'a',
};

/**
 * Example answer submission for open-ended quiz
 */
export const exampleOpenEndedAnswers = {
  q1: 'var is function-scoped while let and const are block-scoped. var is hoisted and initialized as undefined, while let and const are in the temporal dead zone until declaration.',
  q2: 'PoX connects Stacks to Bitcoin by having miners commit BTC to participate in consensus. The committed BTC goes to STX holders who Stack their tokens.',
};

/**
 * Example answer submission for mixed quiz
 */
export const exampleMixedAnswers = {
  q1: 'd',
  q2: 'PoX is the consensus mechanism that connects Stacks to Bitcoin. Miners commit Bitcoin to participate, and STX holders who Stack receive those Bitcoin rewards. This provides Bitcoin security to Stacks.',
  q3: 'a',
  q4: 'Stacks enables smart contracts on Bitcoin, provides faster transactions, lower costs for complex operations, and the Clarity language with safety features. It can read Bitcoin state while maintaining Bitcoin security.',
  q5: 'b',
};
