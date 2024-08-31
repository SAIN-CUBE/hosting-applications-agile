<br />
<div align="center">

<h3 align="center">Hosting Applications agile Backend</h3>


</div>

## About The Project

This project is built with Django and Django Rest Framework, incorporating various other libraries for enhanced functionality such as JWT authentication, CORS handling, permissions and more.



<!-- GETTING STARTED -->

## Getting Started

To set up your project locally, follow these streamlined steps to get it up and running:

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.

- Python 3.9
- pip (Python package manager)
- Virtual environment (recommended)


### Installation

1. Clone the repo

   ```sh
   git clone https://github.com/SAIN-CUBE/hosting-applications-agile.git
   ```
2. Create an environment

   ```sh
    python -m venv venv
   ```
2. Activate environment

   ```sh
    venv\Scripts\activate (in windows)
   ```

4. Install pacakges with pip.

   ```sh
    pip install -r requirements.txt
   ```

5. Enter your `Email address` and `app password` on .env file

5. First create a database by executing
    ```sh
    python manage.py makemigrations
    ```

    ```sh
    python manage.py migration
    ```

6. Now create superuser first using

    ```sh 
    python manage.py createsuperuser
    ```

7. Now you can run the server using

    ```sh
    python manage.py runserver
    ```

Now, using different endpoints, you can register, login, and perform other tasks.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!
