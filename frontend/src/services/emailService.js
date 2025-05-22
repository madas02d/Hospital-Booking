export const sendAppointmentEmail = async ({
  to,
  clinicName,
  clinicEmail,
  patientName,
  appointmentDate,
  appointmentTime,
  reason,
  notes
}) => {
  try {
    const response = await fetch('http://localhost:5000/api/email/send-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        clinicName,
        clinicEmail,
        patientName,
        appointmentDate,
        appointmentTime,
        reason,
        notes
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send appointment emails');
  }
}; 