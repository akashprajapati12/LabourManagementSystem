# Labour Management System

A complete web-based Labour Management System built with Node.js, Express, SQLite, and Bootstrap. This application helps manage labours, track attendance, calculate salaries, manage advances and deductions, and handle leave requests.

## Features

✅ **User Authentication**
- User registration and login
- Secure password hashing with bcryptjs
- JWT token-based authentication

✅ **Labour Management**
- Add, edit, and delete labours
- Store personal details (Aadhar, Bank Account, etc.)
- Track labour designation and daily rates
- Manage labour status (active/inactive)

✅ **Attendance Tracking**
- Mark daily attendance
- Track hours worked
- Support for different statuses (Present, Absent, Half-day, Sick Leave)
- View attendance records by month

✅ **Advance Management**
- Record advances given to labours
- Track pending and paid advances
- Set due dates for advances
- Update advance status

✅ **Deductions Tracking**
- Record various deductions
- Categorize deductions by type
- Track deduction reasons

✅ **Leave Management**
- Request leaves with date range
- Different leave types (Casual, Sick, Earned, Unpaid)
- Approve/Reject leave requests
- View leave history

✅ **Salary Management**
- Automatic salary calculation based on:
  - Daily rate × Days present
  - Minus advances given
  - Minus deductions applied
- Monthly salary records
- Salary slip functionality
- Track salary payment status

✅ **Dashboard**
- Quick statistics on total labours
- Today's attendance summary
- Total advances given
- Pending leave requests

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT, bcryptjs
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Steps

1. **Extract the project** to your desired location

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
   - A `.env` file is provided with default settings
   - Update `JWT_SECRET` for production use
   - Change `PORT` if needed (default: 5000)

4. **Start the server**
```bash
npm start
```

   The application will start at `http://localhost:5000`

5. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - Create a new account to get started

## Default Configuration

```
PORT=5000
JWT_SECRET=your_secret_key_change_this_in_production
NODE_ENV=development
DB_PATH=./database.sqlite
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Labours
- `POST /api/labours` - Create labour
- `GET /api/labours` - Get all labours
- `GET /api/labours/:id` - Get single labour
- `PUT /api/labours/:id` - Update labour
- `DELETE /api/labours/:id` - Delete labour

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/labour/:labourId` - Get labour attendance
- `GET /api/attendance/month/:month` - Get attendance for month
- `DELETE /api/attendance/:id` - Delete attendance

### Advances
- `POST /api/advances` - Add advance
- `GET /api/advances` - Get all advances
- `GET /api/advances/labour/:labourId` - Get labour advances
- `PUT /api/advances/:id` - Update advance
- `DELETE /api/advances/:id` - Delete advance

### Deductions
- `POST /api/deductions` - Add deduction
- `GET /api/deductions` - Get all deductions
- `GET /api/deductions/labour/:labourId` - Get labour deductions
- `PUT /api/deductions/:id` - Update deduction
- `DELETE /api/deductions/:id` - Delete deduction

### Leaves
- `POST /api/leaves` - Request leave
- `GET /api/leaves` - Get all leaves
- `GET /api/leaves/labour/:labourId` - Get labour leaves
- `PUT /api/leaves/:id` - Update leave status
- `DELETE /api/leaves/:id` - Delete leave

### Salaries
- `POST /api/salaries/calculate` - Calculate salary
- `GET /api/salaries` - Get all salaries
- `GET /api/salaries/labour/:labourId` - Get labour salaries
- `GET /api/salaries/month/:month` - Get salaries for month
- `PUT /api/salaries/:id` - Update salary status

## Usage

### Create a Labour
1. Go to "Labours" section
2. Click "Add Labour" button
3. Fill in the labour details
4. Click "Save"

### Mark Attendance
1. Navigate to "Attendance" section
2. Click "Mark Attendance"
3. Select labour, date, and status
4. Click "Save"

### Add Advance
1. Go to "Advances" section
2. Click "Add Advance"
3. Enter labour, amount, and reason
4. Click "Save"

### Calculate Salary
1. Navigate to "Salaries" section
2. Click "Calculate Salary"
3. Select labour and month
4. Click "Calculate"

The system will automatically:
- Count days present in the month
- Calculate basic salary (daily rate × days present)
- Deduct all advances given in that month
- Deduct all deductions for that month
- Calculate net salary (basic - advances - deductions)

## Database Schema

### Users Table
- id, username, password, name, email, role, createdAt

### Labours Table
- id, name, email, phone, address, aadhar, bankAccount, dailyRate, designation, joinDate, status, createdAt

### Attendance Table
- id, labourId, date, status, hours, notes, createdAt

### Advances Table
- id, labourId, amount, date, reason, status, dueDate, createdAt

### Deductions Table
- id, labourId, amount, type, date, reason, createdAt

### Leaves Table
- id, labourId, startDate, endDate, type, reason, status, createdAt

### Salaries Table
- id, labourId, month, basicSalary, daysPresent, totalAdvance, totalDeductions, netSalary, status, createdAt

## Project Structure

```
labour-mgmt-system/
├── public/
│   ├── index.html           # Main frontend file
│   ├── styles/
│   │   └── main.css         # Custom CSS styles
│   └── scripts/
│       └── app.js           # Frontend JavaScript
├── src/
│   ├── db.js                # Database initialization
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   └── routes/
│       ├── auth.js          # Auth routes
│       ├── labours.js       # Labour routes
│       ├── attendance.js    # Attendance routes
│       ├── advances.js      # Advance routes
│       ├── deductions.js    # Deduction routes
│       ├── leaves.js        # Leave routes
│       └── salaries.js      # Salary routes
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env                     # Environment variables
└── database.sqlite          # SQLite database (created on first run)
```

## Security Considerations

1. **Change JWT Secret**: Update the `JWT_SECRET` in `.env` for production
2. **HTTPS**: Use HTTPS in production
3. **Database**: Backup your database.sqlite file regularly
4. **Passwords**: Passwords are hashed using bcryptjs
5. **API Authentication**: All API endpoints require valid JWT token

## Future Enhancements

- 📧 Email notifications for salary payments
- 📊 Advanced reporting and analytics
- 📱 Mobile app version
- 💰 Multiple payment methods
- 🗂️ Document uploads
- 🔔 Real-time notifications
- 📈 Performance metrics
- 🌙 Dark mode
- 🌍 Multi-language support
- 🏢 Multiple branch support

## Troubleshooting

### Port already in use
Change the PORT in `.env` file or kill the process using port 5000

### Database errors
Delete `database.sqlite` file and restart the server to reinitialize the database

### CORS errors
Ensure the API_URL in `public/scripts/app.js` matches your server address

### Authentication failures
Clear browser cache and localStorage, then try logging in again

## License

ISC

## Support

For issues and feature requests, please contact the development team.

---

**Version**: 1.0.0
**Last Updated**: February 2026
