'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * O radar do slogan, feito de luz.
 *
 * Uma grade de pontos que ondula devagar e se ABRE quando o cursor passa — a
 * varredura do radar, em partículas limão. Não é enfeite gratuito: a home
 * promete que "seu currículo vira um radar de vagas", e até agora nada na tela
 * dizia isso.
 *
 * O peso do three.js (~130 KB) não entra no bundle inicial: quem monta este
 * componente é um `next/dynamic` com `ssr: false`, então o texto do herói pinta
 * primeiro e o campo acende depois. O LCP não paga por isso.
 *
 * Três desligamentos, todos obrigatórios:
 * - `prefers-reduced-motion`: não monta nada, e o herói fica com o blur de antes.
 * - fora da tela: o `requestAnimationFrame` para (IntersectionObserver).
 * - telas pequenas: menos pontos, e o devicePixelRatio nunca passa de 2.
 */

const GRID = 62;
const SPACING = 0.34;

export function HeroField() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // O WebGL pode simplesmente não existir (driver antigo, GPU bloqueada). Sem
    // isso, o three lança e o herói inteiro morre junto.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      return;
    }

    const compacto = window.innerWidth < 640;
    const lado = compacto ? Math.round(GRID * 0.7) : GRID;
    const total = lado * lado;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, host.clientWidth / host.clientHeight, 0.1, 100);
    // Quase de cima, levemente inclinada. Numa câmera rasante a perspectiva
    // comprime o fundo numa cunha, e a grade vira um triângulo colado no título
    // — feio, e brigando com o texto. Vista de cima, o campo é uma malha
    // uniforme que se comporta como textura, não como objeto.
    camera.position.set(0, 8.6, 7);
    camera.lookAt(0, 0, 0);

    /**
     * O tema não muda só a cor — muda o modo de pintar.
     *
     * No escuro, limão em blending aditivo: os pontos somam luz sobre a tinta e
     * o campo brilha. No claro, o mesmo aditivo CLAREIA o papel e o campo
     * desaparece (visto na tela: sumiu por completo). Então o claro usa o verde
     * legível da marca, em blending normal, escurecendo em vez de acender.
     */
    const escuro = () => document.documentElement.classList.contains('dark');

    function aplicarTema(m: THREE.PointsMaterial) {
      const css = (nome: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

      if (escuro()) {
        m.color.set(css('--accent-bright') || '#c8f31d');
        m.blending = THREE.AdditiveBlending;
        m.opacity = 0.9;
        m.size = compacto ? 0.045 : 0.04;
      } else {
        m.color.set(css('--accent-ink') || '#4d7c0f');
        m.blending = THREE.NormalBlending;
        // Sem o brilho aditivo para compensar, o ponto claro precisa de mais
        // corpo — senão vira poeira invisível sobre o papel.
        m.opacity = 0.75;
        m.size = compacto ? 0.06 : 0.055;
      }
      m.needsUpdate = true;
    }

    const base = new Float32Array(total * 3);
    const posicoes = new Float32Array(total * 3);
    let i = 0;
    for (let x = 0; x < lado; x++) {
      for (let z = 0; z < lado; z++) {
        base[i] = (x - lado / 2) * SPACING;
        base[i + 1] = 0;
        base[i + 2] = (z - lado / 2) * SPACING;
        i += 3;
      }
    }
    posicoes.set(base);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));

    const mat = new THREE.PointsMaterial({
      transparent: true,
      sizeAttenuation: true,
      depthWrite: false,
    });
    aplicarTema(mat);

    const pontos = new THREE.Points(geo, mat);
    pontos.rotation.x = -0.08;
    scene.add(pontos);

    // O cursor vive em coordenadas do mundo, projetado no plano da grade — é o
    // que faz a repulsão acontecer embaixo do ponteiro, e não num canto qualquer.
    const mouse = new THREE.Vector2(999, 999);
    const alvo = new THREE.Vector2(999, 999);

    function onMove(e: PointerEvent) {
      const r = host!.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -((e.clientY - r.top) / r.height) * 2 + 1;
      // Aproximação boa o bastante para a grade: escala o NDC ao tamanho do campo.
      alvo.set(nx * (lado * SPACING) * 0.5, ny * (lado * SPACING) * 0.32);
    }
    function onLeave() {
      alvo.set(999, 999);
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);

    let visivel = true;
    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting), { threshold: 0 });
    io.observe(host);

    function onResize() {
      if (!host) return;
      renderer.setSize(host.clientWidth, host.clientHeight, false);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // O ThemeToggle mexe na classe do <html>; o campo escuta e se repinta.
    const mo = new MutationObserver(() => aplicarTema(mat));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const relogio = new THREE.Clock();
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visivel) return;

      const t = relogio.getElapsedTime();
      mouse.lerp(alvo, 0.08);

      const arr = geo.attributes.position.array as Float32Array;
      for (let p = 0; p < total; p++) {
        const j = p * 3;
        const x = base[j];
        const z = base[j + 2];

        // A onda: duas senoides cruzadas, a respiração de fundo do campo.
        let y = Math.sin(x * 0.55 + t * 0.9) * 0.22 + Math.cos(z * 0.5 + t * 0.65) * 0.22;

        // A varredura: um anel que sai do centro, como o pulso de um radar.
        const dist = Math.hypot(x, z);
        y += Math.sin(dist * 1.1 - t * 1.6) * 0.14;

        // A repulsão: perto do cursor, os pontos sobem e se afastam.
        const dx = x - mouse.x;
        const dz = z - mouse.y;
        const d2 = dx * dx + dz * dz;
        if (d2 < 6.5) {
          const força = (1 - d2 / 6.5) ** 2;
          y += força * 1.5;
        }

        arr[j + 1] = y;
      }
      geo.attributes.position.needsUpdate = true;

      pontos.rotation.y = Math.sin(t * 0.06) * 0.12;
      renderer.render(scene, camera);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      host.removeEventListener('pointerleave', onLeave);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  /**
   * A máscara é o que impede o efeito de virar ruído.
   *
   * Ela concentra o campo na faixa livre — topo e lado direito, em volta do card
   * de upload — e o apaga sobre o título. Partícula atrás de texto não é efeito,
   * é sujeira. E o card, que no tema claro é branco opaco, esconderia o campo se
   * o centro caísse atrás dele: por isso o foco sobe, e o campo emoldura em vez
   * de ficar por baixo.
   */
  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[640px] [mask-image:radial-gradient(ellipse_58%_50%_at_68%_30%,#000_22%,transparent_72%)]"
    />
  );
}
