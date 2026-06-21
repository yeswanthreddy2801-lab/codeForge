import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo problems...');

  const problems = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      difficulty: Difficulty.EASY,
      category: 'Algorithms',
      tags: ['Arrays', 'Hash Table'],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
      ],
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
      ],
      testCases: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
        { input: '[3,2,4]\n6', expectedOutput: '[1,2]' }
      ],
      starterCode: {
        mylang: 'fn twoSum(nums, target) {\n  // Your code here\n}',
        python: 'def twoSum(nums, target):\n    # Your code here\n    pass',
        cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}',
        java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n    }\n}'
      }
    },
    {
      title: 'Reverse String',
      slug: 'reverse-string',
      statement: 'Write a function that reverses a string. The input string is given as an array of characters `s`.\nYou must do this by modifying the input array in-place with O(1) extra memory.',
      difficulty: Difficulty.EASY,
      category: 'Algorithms',
      tags: ['Strings', 'Two Pointers'],
      constraints: [
        '1 <= s.length <= 10^5',
        's[i] is a printable ascii character.'
      ],
      examples: [
        { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }
      ],
      testCases: [
        { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' }
      ],
      starterCode: {
        mylang: 'fn reverseString(s) {\n  // Your code here\n}',
        python: 'def reverseString(s):\n    # Your code here\n    pass',
        cpp: 'void reverseString(vector<char>& s) {\n    // Your code here\n}',
        java: 'class Solution {\n    public void reverseString(char[] s) {\n        // Your code here\n    }\n}'
      }
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      statement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.',
      difficulty: Difficulty.MEDIUM,
      category: 'Algorithms',
      tags: ['Strings', 'Stack'],
      constraints: [
        '1 <= s.length <= 10^4',
        's consists of parentheses only `()[]{}`.'
      ],
      examples: [
        { input: 's = "()"', output: 'true' },
        { input: 's = "()[]{}"', output: 'true' },
        { input: 's = "(]"', output: 'false' }
      ],
      testCases: [
        { input: '()', expectedOutput: 'true' },
        { input: '()[]{}', expectedOutput: 'true' },
        { input: '(]', expectedOutput: 'false' }
      ],
      starterCode: {
        mylang: 'fn isValid(s) {\n  // Your code here\n}',
        python: 'def isValid(s):\n    # Your code here\n    pass',
        cpp: 'bool isValid(string s) {\n    // Your code here\n}',
        java: 'class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n    }\n}'
      }
    }
  ];

  for (const problem of problems) {
    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: problem,
      create: problem,
    });
    console.log(`Upserted problem: ${problem.title}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
