export const login = async (email: string, password: string) => {
  // Simulamos el tiempo de carga de la red (1.5 segundos)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // --- EJEMPLO DE CÓMO SERÁ TU CÓDIGO REAL PARA PHP/LARAVEL ---
  /*
  const response = await fetch('https://tu-api.com/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error: any = new Error('Error en login');
    error.response = { status: response.status };
    throw error;
  }
  return await response.json();
  */

  // --- RESPUESTA SIMULADA PARA QUE PUEDAS PROBAR HOY ---
  // Si pones el correo "admin@tuali.com", te dejará pasar.
  if (email === 'admin@tuali.com' && password === '123456') {
    return {
      data: {
        role: 'admin',
        name: 'Administrador Tuali',
        token: 'fake-jwt-token-123'
      }
    };
  } else {
    // Simulamos un error 401 de credenciales incorrectas
    const error: any = new Error('Unauthorized');
    error.response = { status: 401 };
    throw error;
  }
};