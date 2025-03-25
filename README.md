# QuickCode - A LeetCode Clone with Real-time Architecture

## Overview

QuickCode is a high-performance coding platform inspired by LeetCode, rearchitected with modern real-time technologies to provide a smoother coding interview preparation experience. Unlike traditional platforms that use HTTP polling, QuickCode implements a WebSocket-based communication system for efficient real-time code execution feedback.

## Key Features

### Real-time Code Execution
- **WebSocket Integration**: Eliminates HTTP polling with persistent WebSocket connections for instant feedback
- **Live Results**: Get execution results as soon as they're available without page refreshes

### Scalable Backend Architecture
- **Master-Worker Model**: Distributed system for handling code execution workloads
  - **Master Node**: Orchestrates job distribution and result aggregation
  - **Worker Nodes**: Execute user code in isolated environments
- **Message Queue System**: Redis-powered job queue for efficient task distribution
- **Pub/Sub System**: Real-time result delivery through Redis Pub/Sub channels

### Modern Tech Stack
- **Frontend**: Next.js application with optimized client-side rendering
- **Intermediate Server**: Next.js API routes handling WebSocket connections
- **Execution Service**: Containerized worker nodes with secure code execution

## Architecture Highlights

```
Client (Next.js) ↔ WebSocket ↔ Next.js API Server ↔ Master Node
                                                  ↓
                                              Redis Queue
                                                  ↓
                                           Worker Nodes (Code Execution)
                                                  ↑
                                             Redis Pub/Sub
```

## Why QuickCode?

1. **Faster Feedback**: Real-time updates mean no more waiting for polling intervals
2. **Scalable**: Handles thousands of concurrent code executions efficiently
3. **Reliable**: Distributed architecture prevents single points of failure
4. **Modern UX**: Smooth, app-like experience with instant updates

## Development Setup

-

## images  

![image](https://github.com/user-attachments/assets/850053ba-a3b8-4607-8d2f-985774b683e7)  
![image](https://github.com/user-attachments/assets/34275402-2b70-4039-9d09-f31d653fd2e6)  


## License

[Specify your license here]

---

QuickCode reimagines the coding challenge platform with real-time capabilities and a scalable backend, providing developers with a seamless environment to practice and master algorithmic problem-solving.
