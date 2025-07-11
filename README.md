# Kebab Koordynator

An application to gather and organize kebab orders from a group of people. This version is containerized with Docker, packaging the frontend and backend together for easy deployment.

## Features
- **Shared Order List**: Real-time order list shared between all users.
- **Simple Interface**: Easy-to-use form for adding new orders.
- **Admin Mode**: A special mode that can be toggled on to allow editing and deleting of existing orders.

## How to Run with Docker

Running the application is simple. With Docker installed, you only need to build the image and run the container.

**Prerequisites:**
- [Docker](https://www.docker.com/get-started) installed on your system.

**Run the Application:**

1.  Open a terminal or command prompt in the project's root directory (where the `Dockerfile` is located).

2.  **Build the Docker image** by running the following command. We'll tag it as `kebab-app`:
    ```bash
    docker build -t kebab-app .
    ```

3.  **Run the Docker container** from the image you just built:
    ```bash
    docker run -p 8000:8000 kebab-app
    ```
    - `-p 8000:8000` maps port 8000 on your local machine to port 8000 inside the container.

4.  That's it! The application (both frontend and backend) is now running. Open your web browser and navigate to:
    [http://localhost:8000](http://localhost:8000)

## Using Admin Mode

To edit or delete orders, you must enable Admin Mode.
- Find the **"Tryb Admina"** toggle switch in the header at the top of the page.
- Click the switch to turn it on.
- You will be prompted for a password. The password is: `kebab`
- If you enter the correct password, "Edit" and "Delete" buttons will now appear on each order item.
- Your choice is saved, so you will remain in Admin Mode if you refresh the page.