# Authentication Setup

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
REACT_APP_VIEWER_PASSWORD=your_viewer_password
REACT_APP_ADMIN_PASSWORD=your_admin_password
```

## Default Passwords (for development)

If no environment variables are set, the system uses these defaults:
- Viewer: `2025`
- Admin: `admin2025`

## Security Notes

- The `.env.local` file is automatically ignored by git
- Never commit passwords to the repository
- For production deployment, set these environment variables in your hosting platform
