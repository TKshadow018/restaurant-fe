export const isUserAdmin = (userEmail) => {
  if (!userEmail) return false;
  
  const adminEmails = [
    process.env.REACT_APP_ADMIN_EMAIL,
    process.env.REACT_APP_DEV_EMAIL,
    process.env.REACT_APP_CONTACT_EMAIL
  ].filter(Boolean); // Remove any undefined/null values
  
  return adminEmails.some(adminEmail => 
    userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim()
  );
};