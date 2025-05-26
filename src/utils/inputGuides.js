const inputGuides = {
  Python: {
    title: "Python sys.argv Input Guide",
    icon: "🐍",
    description:
      "Learn how to handle different types of input in Python using sys.argv for command-line arguments",
    examples: [
      {
        title: "Single Integer",
        code: `import sys

# Method 1: Using sys.argv
n = int(sys.argv[1])

# Method 2: With error handling
if len(sys.argv) > 1:
    n = int(sys.argv[1])`,
        explanation: "Read a single integer from command-line arguments",
      },
      {
        title: "Multiple Integers (Same Line)",
        code: `import sys

# Individual arguments
a, b, c = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])

# Or using list comprehension
numbers = list(map(int, sys.argv[1:4]))

# All remaining arguments
all_numbers = list(map(int, sys.argv[1:]))`,
        explanation: "Read multiple integers from command-line arguments",
      },
      {
        title: "Array/List Input",
        code: `import sys

# Read array from all arguments
arr = list(map(int, sys.argv[1:]))

# For floating point numbers
arr = list(map(float, sys.argv[1:]))

# Skip first n arguments, then take array
n = int(sys.argv[1])
arr = list(map(int, sys.argv[2:]))`,
        explanation: "Read an array of integers from command-line arguments",
      },
      {
        title: "Matrix Input",
        code: `import sys

# Read matrix dimensions and elements
rows, cols = int(sys.argv[1]), int(sys.argv[2])
elements = list(map(int, sys.argv[3:]))

# Reconstruct matrix
matrix = []
for i in range(rows):
    row = elements[i * cols:(i + 1) * cols]
    matrix.append(row)

# Alternative: List comprehension
matrix = [elements[i * cols:(i + 1) * cols] for i in range(rows)]`,
        explanation: "Read a 2D matrix from command-line arguments",
      },
      {
        title: "String Input",
        code: `import sys

# Single string
s = sys.argv[1]

# Multiple strings as list
words = sys.argv[1:]

# Join all arguments into single string
full_string = ' '.join(sys.argv[1:])

# Remove quotes if present
s = sys.argv[1].strip('"\'')`,
        explanation: "Read string inputs from command-line arguments",
      },
    ],
  },
  "C++": {
    title: "C++ Input Guide",
    icon: "⚡",
    description: "Learn how to handle different types of input in C++",
    examples: [
      {
        title: "Single Integer",
        code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    // For faster I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    return 0;
}`,
        explanation: "Read a single integer from input",
      },
      {
        title: "Multiple Integers",
        code: `#include <iostream>
using namespace std;

int main() {
    int a, b, c;
    cin >> a >> b >> c;
    
    return 0;
}`,
        explanation: "Read multiple integers",
      },
      {
        title: "Array Input",
        code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    vector<int> arr(n);
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    return 0;
}`,
        explanation: "Read an array of integers",
      },
      {
        title: "Matrix Input",
        code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int rows, cols;
    cin >> rows >> cols;
    
    vector<vector<int>> matrix(rows, vector<int>(cols));
    
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            cin >> matrix[i][j];
        }
    }
    
    return 0;
}`,
        explanation: "Read a 2D matrix",
      },
      {
        title: "String Input",
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;  // Single word
    
    string line;
    getline(cin, line);  // Entire line with spaces
    
    return 0;
}`,
        explanation: "Read string inputs",
      },
    ],
  },
  Java: {
    title: "Java Input Guide",
    icon: "☕",
    description: "Learn how to handle different types of input in Java",
    examples: [
      {
        title: "Scanner Setup",
        code: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Your code here
        
        sc.close();
    }
}`,
        explanation: "Basic Scanner setup for input",
      },
      {
        title: "Single Integer",
        code: `Scanner sc = new Scanner(System.in);
int n = sc.nextInt();`,
        explanation: "Read a single integer",
      },
      {
        title: "Multiple Integers",
        code: `Scanner sc = new Scanner(System.in);
int a = sc.nextInt();
int b = sc.nextInt();
int c = sc.nextInt();`,
        explanation: "Read multiple integers",
      },
      {
        title: "Array Input",
        code: `Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
int[] arr = new int[n];

for (int i = 0; i < n; i++) {
    arr[i] = sc.nextInt();
}`,
        explanation: "Read an array of integers",
      },
      {
        title: "Matrix Input",
        code: `Scanner sc = new Scanner(System.in);
int rows = sc.nextInt();
int cols = sc.nextInt();

int[][] matrix = new int[rows][cols];

for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        matrix[i][j] = sc.nextInt();
    }
}`,
        explanation: "Read a 2D matrix",
      },
      {
        title: "String Input",
        code: `Scanner sc = new Scanner(System.in);
String s = sc.next();        // Single word
String line = sc.nextLine(); // Entire line`,
        explanation: "Read string inputs",
      },
    ],
  },
  JavaScript: {
    title: "JavaScript Input Guide",
    icon: "🟨",
    description:
      "Learn how to handle different types of input in JavaScript (Node.js)",
    examples: [
      {
        title: "Readline Setup",
        code: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Alternative: Using process.stdin directly
process.stdin.setEncoding('utf8');`,
        explanation: "Setup for reading input in Node.js",
      },
      {
        title: "Single Integer",
        code: `// Using readline
rl.question('', (input) => {
    const n = parseInt(input.trim());
    console.log(n);
    rl.close();
});

// Using process.stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    const n = parseInt(input.trim());
});`,
        explanation: "Read a single integer",
      },
      {
        title: "Multiple Integers",
        code: `rl.question('', (input) => {
    const [a, b, c] = input.trim().split(' ').map(Number);
    console.log(a, b, c);
    rl.close();
});`,
        explanation: "Read multiple integers from same line",
      },
      {
        title: "Array Input",
        code: `rl.question('', (input) => {
    const arr = input.trim().split(' ').map(Number);
    console.log(arr);
    rl.close();
});

// With size first
const lines = [];
rl.on('line', (line) => {
    lines.push(line.trim());
    if (lines.length === 2) {
        const n = parseInt(lines[0]);
        const arr = lines[1].split(' ').map(Number);
        rl.close();
    }
});`,
        explanation: "Read an array of integers",
      },
      {
        title: "Matrix Input",
        code: `const lines = [];
rl.on('line', (line) => {
    lines.push(line.trim());
});

rl.on('close', () => {
    const [rows, cols] = lines[0].split(' ').map(Number);
    const matrix = [];
    
    for (let i = 1; i <= rows; i++) {
        matrix.push(lines[i].split(' ').map(Number));
    }
    
    console.log(matrix);
});`,
        explanation: "Read a 2D matrix",
      },
    ],
  },
  TypeScript: {
    title: "TypeScript Input Guide",
    icon: "🔷",
    description:
      "Learn how to handle different types of input in TypeScript (Node.js)",
    examples: [
      {
        title: "Readline Setup with Types",
        code: `import * as readline from 'readline';

const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Type definitions
type InputCallback = (input: string) => void;`,
        explanation: "Setup with TypeScript types",
      },
      {
        title: "Single Integer",
        code: `rl.question('', (input: string): void => {
    const n: number = parseInt(input.trim());
    console.log(n);
    rl.close();
});`,
        explanation: "Read a single integer with types",
      },
      {
        title: "Array Input",
        code: `rl.question('', (input: string): void => {
    const arr: number[] = input.trim().split(' ').map(Number);
    console.log(arr);
    rl.close();
});`,
        explanation: "Read an array with proper typing",
      },
      {
        title: "Matrix Input",
        code: `const lines: string[] = [];

rl.on('line', (line: string): void => {
    lines.push(line.trim());
});

rl.on('close', (): void => {
    const [rows, cols]: number[] = lines[0].split(' ').map(Number);
    const matrix: number[][] = [];
    
    for (let i = 1; i <= rows; i++) {
        matrix.push(lines[i].split(' ').map(Number));
    }
    
    console.log(matrix);
});`,
        explanation: "Read a 2D matrix with types",
      },
    ],
  },
};
export default inputGuides;
