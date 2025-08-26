# 🎵 Massey Hall Song List 2025

A React-based song tracking application for band management, featuring role-based authentication, PDF management, and real-time collaboration.

## 🚀 Live Deployment

**Access the app here:** [https://davidglabais.github.io/massey-hall-song-list-2025/](https://davidglabais.github.io/massey-hall-song-list-2025/)

## ✨ Features

- **Role-Based Access Control**: Admin and Viewer modes with different permissions
- **Song Management**: Add, edit, and delete songs with duration tracking
- **Instrument Player Tracking**: Assign players to Electric Guitar, Acoustic Guitar, Bass, Vocals, and Backup Vocals
- **PDF Support**: Upload and manage multiple PDFs per song
- **Real-time Database**: Powered by Supabase for live data synchronization
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Secure Authentication**: Password-protected access for band members

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom password-based system
- **Deployment**: GitHub Pages
- **Build Tool**: Create React App

## 🏗️ Project Structure

```
src/
├── components/
│   ├── SimpleAuth.tsx       # Authentication component
│   ├── Toast.tsx           # Notification system
│   └── Notification.tsx    # Alert messages
├── SongDurationTracker.tsx  # Main application component
├── songService.ts           # Database operations
├── supabaseClient.ts        # Database configuration
└── App.tsx                 # Application root
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DavidGlabais/massey-hall-song-list-2025.git
cd massey-hall-song-list-2025
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📦 Available Scripts

### `npm start`
Runs the app in development mode with hot reloading.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm run deploy`
Deploys the built app to GitHub Pages.

### `npm test`
Launches the test runner in interactive watch mode.

## 🔧 Configuration

### Database Setup
The app uses Supabase as the backend. Ensure your database has a `songs` table with the following structure:

```sql
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  duration TEXT,
  players JSONB DEFAULT '{"electricGuitar":[],"acousticGuitar":[],"bass":[],"vocals":[],"backupVocals":[]}',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Usage

### Admin Features
- Add new songs to the collection
- Edit song titles and durations
- Assign players to different instruments
- Upload and manage PDF files
- Delete songs and remove players

### Viewer Features
- View the complete song list
- See player assignments for each song
- Access PDF files
- Mobile-responsive interface

## 🚢 Deployment

The app is automatically deployed to GitHub Pages using the `gh-pages` package. To deploy:

```bash
npm run deploy
```

The deployment URL will be: `https://davidglabais.github.io/massey-hall-song-list-2025/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and intended for band use only.

## 🆘 Support

For issues or questions, please create an issue in the GitHub repository.

---

Built with ❤️ for Massey Hall band management

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
