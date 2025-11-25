import React, { useRef, useEffect } from 'react';

const BiosecurityBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 0.5;
        // CAMBIO 1: Color base de partículas más Cian/Turquesa para que contraste con el azul
        this.baseColor = 'rgba(45, 212, 191,'; // Antes era verde puro
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 200) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (200 - distance) / 200;
            const directionX = forceDirectionX * force * 0.05;
            const directionY = forceDirectionY * force * 0.05;
            this.vx += directionX;
            this.vy += directionY;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${this.baseColor} ${0.4})`; // Un poco más brillante
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const numberOfParticles = (window.innerWidth * window.innerHeight) / 15000;
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // CAMBIO 2: EL NUEVO GRADIENTE TIPO "AURORA" (Verde a Azul)
      // Usamos un gradiente diagonal (de esquina a esquina) para un efecto más dinámico
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Inicio (Arriba Izquierda): Verde Oscuro Profundo
      gradient.addColorStop(0, '#012a2a'); 
      // Medio: Transición Teal/Azul oscuro
      gradient.addColorStop(0.5, '#004e64');
      // Final (Abajo Derecha): Azul Tecnológico Profundo
      gradient.addColorStop(1, '#0f3a68'); 
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // CAMBIO 3: Color de las líneas de conexión a Cian/Turquesa
      particles.forEach((a, index) => {
        for (let j = index; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            // Usamos un color cian para las líneas, desvaneciéndose con la distancia
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.12 - distance/1500})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', () => {});
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

export default BiosecurityBackground;