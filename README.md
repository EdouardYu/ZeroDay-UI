# **ZeroDay-UI - Frontend for a Social Network with CTF Challenges**

**ZeroDay-UI** is the frontend service for a social networking platform designed as part of the **Software Security project at ISEP**. This platform allows users to connect and participate in **CTF (Capture the Flag)** challenges, exploring and learning about common security vulnerabilities.

---

## **Purpose**

This project simulates real-world security issues to:

1. Enable hands-on practice with vulnerabilities such as path traversal, SSRF, JWT exploitation, and SpEL injection.
2. Teach secure software development techniques by addressing these vulnerabilities.

---

## **Backend Repository**

The Backend for this project is available in a separate repository:  
[Backend Repository](https://github.com/EdouardYu/ZeroDay)

---

## **CTF Challenges Implemented**

### 1. Path Traversal, SSRF, and JWT Forgery

- **Path Traversal**: Exploit path traversal vulnerabilities to access sensitive configuration files.
- **SSRF**: Exploit the server to access restricted internal resources.
- **JWT Exploitation**: Manipulate JWT to escalate privileges.

### 2. SpEL Injection Attack

- **SpEL Injection**: Exploit Spring Expression Language (SpEL) injection to execute arbitrary commands or retrieve system environment variables on the server.
