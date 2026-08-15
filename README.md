# TakeCare

TakeCare is a web application designed to help parents and guardians organize important information related to the care of a child or another person with special support needs. It provides a centralized space for care profiles, therapies, appointments, professional contacts, diary entries, medical documents, and collaboration with a support coordinator.

The application is intended as an organizational and communication tool. It is not a medical information system and does not provide diagnoses, prescribe treatment, or replace professional medical advice.

## Table of Contents

- [About the Project](#about-the-project)
- [User Roles](#user-roles)
- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Security and Access Control](#security-and-access-control)
- [Future Improvements](#future-improvements)
- [Disclaimer](#disclaimer)
- [Author](#author)

## About the Project

Parents and guardians often manage care-related information across paper documents, messages, emails, calendars, and different applications. This makes it difficult to find relevant information quickly and share it with a trusted support professional.

TakeCare brings these records together in one application. The patient is the central entity of the system but does not have a user account. Data is managed by the parent or guardian and, where permission is granted, by an assigned support coordinator.

The project was developed as a bachelor's thesis using a REST-based client-server architecture.

## User Roles

### Parent or Guardian

The parent or guardian is the primary user of the application and can:

- create and maintain the patient's care profile;
- manage diary entries and personal observations;
- manage therapies and review therapy details;
- record therapy intake as taken or skipped;
- view therapy intake history;
- access professional contacts connected to the patient;
- send appointment requests and respond to proposed appointment times;
- manage calendar events;
- upload and manage medical documentation;
- control and review shared patient information.

### Support Coordinator

The support coordinator assists the parent with care organization and coordination. The coordinator can:

- view the assigned patient's relevant information;
- add professional notes and observations;
- manage professional contacts associated with the patient;
- add and review documentation;
- create and update therapies based on available professional instructions;
- review appointment requests;
- approve, reject, or propose a different appointment time;
- view the shared calendar and upcoming responsibilities.

The support coordinator cannot record whether the patient took or skipped a therapy dose.

## Main Features

### Authentication and Authorization

- User registration and sign-in
- JWT-based authentication
- Role-based access control
- Separate interfaces and permissions for parents and support coordinators
- Protected frontend routes and backend endpoints

### Care Profile

- Centralized patient information
- Important health and support-related details
- Parent and assigned coordinator information
- Controlled data sharing between authorized users

### Diary

- Personal and professional diary entries
- Entry categories
- Filtering by category and date
- Editing and deletion based on ownership and permissions
- Expandable display for longer entries

### Therapies

- Creation and editing of therapy records
- Active, paused, and completed therapy statuses
- Dosage, frequency, schedule, period, and instruction details
- Optional connection to the professional who prescribed or recommended the therapy
- Therapy intake recording for parents
- Taken and skipped intake history

### Professional Contacts

- Searchable and filterable list of healthcare and support professionals
- Profession and contact details
- Connection of existing professionals to the patient
- Professional details page
- Display of the next scheduled appointment with a professional

### Appointment Requests

- Appointment request creation by the parent
- Selection of a connected professional
- Request status tracking
- Approval or rejection by the support coordinator
- Proposal of an alternative appointment time
- Parent response to proposed times
- Appointment cancellation and request history

### Calendar

- Monthly overview of care-related activities
- Appointments, therapy reminders, and manually created events
- Event creation, editing, and deletion
- Event-type legend that also acts as a filter
- Direct navigation to a selected calendar date

### Medical Documentation

- Upload and organization of relevant documents
- Document metadata and categorization
- Visibility and access control
- Shared access for authorized users

### Dashboards

- Role-specific parent and coordinator dashboards
- Overview of current responsibilities and recent activity
- Upcoming appointments
- Active therapies
- Recent diary entries and relevant patient information

## Technology Stack

### Backend

- Java
- Spring Boot
- Spring Security
- JSON Web Tokens (JWT)
- Spring Data JPA
- Jakarta Bean Validation
- REST API

### Frontend

- Angular
- TypeScript
- HTML
- SCSS
- Angular Material
- FullCalendar

### Data and Development Tools

- Relational SQL database
- Git and GitHub
- Maven
- npm
- Postman for API testing

## System Architecture

TakeCare follows a client-server architecture:

1. The Angular frontend provides the user interface and sends HTTP requests.
2. The Spring Boot backend exposes REST endpoints and applies business rules.
3. Spring Security and JWT protect authenticated and role-specific operations.
4. Spring Data JPA manages persistence in the relational database.
5. Uploaded documents are associated with the appropriate patient and visibility rules.

## Getting Started

### Prerequisites

Install the following tools before running the project:

- Java Development Kit compatible with the backend project
- Maven, or use the included Maven wrapper if available
- Node.js and npm compatible with the Angular project
- Angular CLI
- A supported relational database
- Git

### Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### Backend Setup

1. Open the backend project directory.
2. Create an empty database for the application.
3. Configure the database connection and JWT settings.
4. Start the Spring Boot application using the Maven wrapper:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
mvnw.cmd spring-boot:run
```

If the project does not include a Maven wrapper, run:

```bash
mvn spring-boot:run
```

### Frontend Setup

Open the frontend project directory and install the dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
ng serve
```

Open the local address displayed in the terminal. Angular commonly uses `http://localhost:4200` during development unless another port is configured.

## Configuration

The exact property names depend on the local backend configuration. The application requires values for:

- database URL;
- database username and password;
- JPA and schema settings;
- JWT secret and token expiration;
- allowed frontend origin;
- document upload location and file-size limits, where applicable.

Sensitive values should not be committed to source control. Use environment variables, an ignored local configuration file, or another secure configuration method.

The Angular environment configuration should point to the correct backend API base URL.

## Running the Application

1. Start the database service.
2. Start the Spring Boot backend.
3. Start the Angular frontend.
4. Open the frontend in a web browser.
5. Register or sign in with a parent or support coordinator account.

For a complete demonstration, prepare test data for both roles, including a patient profile, professional contacts, therapies, diary entries, documents, appointment requests, and calendar events.

## Project Structure

A typical high-level structure is shown below. Folder names may differ depending on the repository organization.

```text
TakeCare/
|-- backend/               # Spring Boot REST API
|   |-- src/main/java/     # Controllers, services, repositories and entities
|   `-- src/main/resources/# Application configuration
|-- frontend/              # Angular client application
|   `-- src/app/           # Components, services, models, routing and guards
`-- README.md
```

## Security and Access Control

- Passwords are stored as secure hashes rather than plain text.
- JWT tokens are used to authenticate API requests.
- Backend authorization rules restrict operations by role.
- Frontend guards prevent navigation to unauthorized pages.
- Access to patient data is limited to the linked parent and support coordinator.
- UI restrictions are supported by backend validation and authorization.

## Future Improvements

The current version focuses on the central care-organization workflow. Possible future improvements include:

- in-app, email, or push notifications for upcoming appointments and therapy schedules;
- configurable reminders and reminder preferences;
- support for multiple patients per parent or coordinator;
- optional accounts for additional authorized caregivers or professionals;
- real-time updates and secure messaging between a parent and coordinator;
- advanced reporting and export of therapy intake, diary, and appointment data;
- integration with external calendar services;
- document preview, versioning, and more advanced search;
- improved accessibility testing and compliance;
- multilingual user interface;
- automated unit, integration, and end-to-end test coverage;
- deployment using containerization and a cloud hosting platform.

## Disclaimer

TakeCare is an educational software project intended for information organization and support coordination. It does not provide medical advice, diagnose conditions, prescribe treatment, validate entered medical information, issue electronic prescriptions, or replace official medical records and qualified healthcare professionals.

## Author

Developed by **Danijela Medić** as a bachelor's thesis project.

