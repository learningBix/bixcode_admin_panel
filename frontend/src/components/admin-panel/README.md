# BixCode Admin Panel

A professional React-based admin panel for managing student registrations and subscriptions in the BixCode educational platform.

## Features

### Register Student Tab
- **Individual Registration**: Add students one by one with form validation
- **Bulk Enrollment**: Upload CSV/Excel files for mass student registration
- **Dynamic Table**: Add/remove rows dynamically for multiple entries
- **Form Validation**: Email format validation and required field checking
- **Clear Functionality**: Reset all form fields with one click

### Subscribed Students Tab
- **Advanced Search**: Search across all fields or specific fields (name, email, phone, class, school)
- **Sortable Columns**: Click column headers to sort by any field
- **Status Management**: View active/inactive student status
- **Bulk Actions**: Export to CSV, send bulk emails
- **Real-time Filtering**: Instant search results as you type
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Components

### AdminPanel
Main container component with tab navigation and routing.

### RegisterStudent
Handles student registration with form management and validation.

### SubscribedStudents
Manages subscribed students with search, sort, and bulk operations.

## Usage

```jsx
import { AdminPanel } from './components/admin-panel';

function App() {
  return (
    <div className="App">
      <AdminPanel />
    </div>
  );
}
```

## Styling

The admin panel uses a professional color scheme:
- **Primary Blue**: #007bff (buttons, active states)
- **Orange Accent**: #fd7e14 (secondary actions)
- **Dark Grey**: #495057 (headers, text)
- **Light Grey**: #6c757d (secondary text)
- **Success Green**: #28a745 (export, success actions)
- **Info Blue**: #17a2b8 (bulk actions)

## Responsive Design

- **Desktop**: Full table view with all features
- **Tablet**: Optimized spacing and touch-friendly buttons
- **Mobile**: Stacked layout with simplified navigation

## Data Structure

### Student Object
```javascript
{
  id: number,
  name: string,
  email: string,
  phone: string,
  className: string,
  schoolName?: string,
  subscriptionDate?: string,
  status?: 'Active' | 'Inactive'
}
```

## Future Enhancements

- [ ] API integration for backend data persistence
- [ ] File upload validation and processing
- [ ] Email notification system
- [ ] Advanced filtering options
- [ ] Student profile management
- [ ] Analytics and reporting
- [ ] Role-based access control

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Installation

1. Copy the `admin-panel` folder to your components directory
2. Import and use the `AdminPanel` component
3. Ensure CSS files are properly linked
4. Customize colors and styling as needed

## License

This component is part of the BixCode project and follows the same licensing terms.
