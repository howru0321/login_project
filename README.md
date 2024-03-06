# login project
> development period : 2024.01.20 - 2024.03.06

## introduction
### Purpose of the Project
The primary goal of this project is to foster a comprehensive understanding of fundamental login logic, encompassing concepts such as access tokens, refresh tokens, and MySQL integration. By delving into the intricacies of these components, developers can gain valuable insights into secure authentication processes.

### Key Features
- JWT-based Authentication: I've implemented a authentication process using JSON Web Tokens (JWT). Both access tokens and refresh tokens have been meticulously crafted to enhance security and user experience.

- Login Logic: Beyond a basic grasp of login processes, this project offers a detailed exploration of various facets, including access token and refresh token concepts.

- Password Recovery: In addition to the login workflow, I've developed a logic for handling password recovery. Users who forget their passwords can seamlessly initiate the recovery process through email verification.

## Requirements
- Node.js v20.11.0
- npm 10.2.4

## Page

| Sign In             | Sign up       |
|---------------------|----------------------|
| ![Sign In](signin.png) | ![Create Account](signup.png) |

|| Forgot Password|                      |
|---------------------|----------------------|----------------------|
| ![Step 1](enterEmail.png) | ![Step 2](enterCode.png) | ![Step 3](resetPassword.png) |

## Database Usage
In this project, I leverage three crucial databases to efficiently manage user information and facilitate secure authentication processes.

### MySQL
MySQL serves as the primary database for storing user information. This includes essential details required for user authentication and management.

### Redis (Local)
For local operations, I employ Redis to store user email as the key and its corresponding refresh token as the value. This setup ensures that each user is assigned a unique refresh token, enhancing security and preventing token misuse.

### Redis (Cloud)
In the cloud environment, Redis comes into play for storing temporary values during the password recovery process. Specifically, I use Redis to save user email as the key and the authentication code as the value. Given the transient nature of these values, Redis proves to be a suitable choice. Additionally, I set a validity period of 5 minutes to ensure timely and secure verification during the password recovery process.

## Authentication Flow
### Token Flow
![alt text](tokenFlow.png)
### OAuth2.0(google) Flow
![alt text](oauthFlow.png)