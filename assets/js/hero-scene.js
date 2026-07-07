/* =====================================================
   HERO SCENE — grafo de nodos 3D (Three.js)
   CORONEL GUEVARA 2026 · Arquitectura de Software
   -----------------------------------------------------
   No es un efecto de "partículas" genérico: es un grafo
   de nodos conectados en el espacio, la misma idea que
   un diagrama de componentes de software, flotando en 3D
   detrás del hero. Se degrada con elegancia si WebGL o
   `prefers-reduced-motion` no están disponibles.
   ===================================================== */
(function () {
    'use strict';

    var mount = document.getElementById('hero-canvas-mount');
    if (!mount) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
        console.info('[hero-scene] Desactivado: el navegador/sistema tiene activado "reducir movimiento".');
        return;
    }

    var isSmall = window.innerWidth < 768;
    var NODE_COUNT = isSmall ? 60 : 150;
    var MAX_LINK_DIST = isSmall ? 3.1 : 3.4;
    var LINKS_PER_NODE = 3;

    var UNIT_DATA = [
        { num: '01', title: 'Introducción y Requerimientos', startWeek: 1, href: 'pages/unidad1.html' },
        { num: '02', title: 'Patrones y Estilos Arquitectónicos', startWeek: 5, href: 'pages/unidad2.html' },
        { num: '03', title: 'Comunicación de Arquitecturas', startWeek: 9, href: 'pages/unidad3.html' },
        { num: '04', title: 'Frameworks y Evaluación', startWeek: 13, href: 'pages/unidad4.html' }
    ];
    var GEM_POS = isSmall
        ? [[-1.6, 3.0, 0.8], [-1.3, 0.6, -1.2], [1.3, -0.8, 1.4], [1.6, -3.0, -0.6]]
        : [[-5.0, 1.6, 1.2], [-1.7, -1.1, -1.6], [1.8, 1.3, 1.8], [5.0, -1.4, -1.0]];
    var TETRA_OFFSETS = [
        [0.24, 0.24, 0.24],
        [0.24, -0.24, -0.24],
        [-0.24, 0.24, -0.24],
        [-0.24, -0.24, 0.24]
    ];

    import('./vendor/three/three.module.min.js')
        .then(function (THREE) {
            try {
                initScene(THREE);
                console.info('[hero-scene] Grafo 3D iniciado correctamente.');
            } catch (err) {
                console.warn('[hero-scene] WebGL no disponible, se mantiene el fondo CSS.', err);
            }
        })
        .catch(function (err) {
            console.warn('[hero-scene] No se pudo cargar three.js desde el CDN (revisa la pestaña Network), se mantiene el fondo CSS.', err);
        });

    function initScene(THREE) {
        var canvas = document.createElement('canvas');
        canvas.id = 'hero-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        mount.appendChild(canvas);

        var renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'low-power'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(0, 0, 13);

        var group = new THREE.Group();
        scene.add(group);

        /* ---- Generar nodos dentro de un volumen elipsoidal ---- */
        var basePositions = new Float32Array(NODE_COUNT * 3);
        var colors = new Float32Array(NODE_COUNT * 3);
        var phases = new Float32Array(NODE_COUNT);
        var limeCol = new THREE.Color(0xc8f04a);
        var mintCol = new THREE.Color(0x6ffcc0);

        for (var i = 0; i < NODE_COUNT; i++) {
            var u = Math.random(), v = Math.random(), w = Math.random();
            var x = (u - 0.5) * 15;
            var y = (v - 0.5) * 9;
            var z = (w - 0.5) * 8;
            basePositions[i * 3] = x;
            basePositions[i * 3 + 1] = y;
            basePositions[i * 3 + 2] = z;
            phases[i] = Math.random() * Math.PI * 2;

            var mixT = Math.random() > 0.78 ? 1 : 0;
            var c = limeCol.clone().lerp(mintCol, mixT ? 0.85 : 0);
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }

        var posAttr = new Float32Array(basePositions);
        var pointsGeo = new THREE.BufferGeometry();
        pointsGeo.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
        pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        var pointsMat = new THREE.PointsMaterial({
            size: isSmall ? 0.09 : 0.075,
            map: dotTexture(THREE),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            opacity: 0.95
        });

        var points = new THREE.Points(pointsGeo, pointsMat);
        group.add(points);

        /* ---- Calcular aristas (edges) una sola vez, sobre las posiciones base ---- */
        var edgeVerts = [];
        var edgeColors = [];
        for (var a = 0; a < NODE_COUNT; a++) {
            var dists = [];
            for (var b = 0; b < NODE_COUNT; b++) {
                if (a === b) continue;
                var dx = basePositions[a * 3] - basePositions[b * 3];
                var dy = basePositions[a * 3 + 1] - basePositions[b * 3 + 1];
                var dz = basePositions[a * 3 + 2] - basePositions[b * 3 + 2];
                var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (d < MAX_LINK_DIST) dists.push([d, b]);
            }
            dists.sort(function (p, q) { return p[0] - q[0]; });
            for (var k = 0; k < Math.min(LINKS_PER_NODE, dists.length); k++) {
                var bIdx = dists[k][1];
                if (bIdx > a) { // evitar duplicar la misma arista
                    edgeVerts.push(
                        basePositions[a * 3], basePositions[a * 3 + 1], basePositions[a * 3 + 2],
                        basePositions[bIdx * 3], basePositions[bIdx * 3 + 1], basePositions[bIdx * 3 + 2]
                    );
                    var t = 1 - dists[k][0] / MAX_LINK_DIST;
                    var ec = limeCol.clone().lerp(mintCol, 0.3);
                    for (var rep = 0; rep < 2; rep++) {
                        edgeColors.push(ec.r, ec.g, ec.b);
                    }
                }
            }
        }

        var lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
        lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(edgeColors, 3));
        var lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        var lines = new THREE.LineSegments(lineGeo, lineMat);
        group.add(lines);

        /* ---- Gemas: 1 por unidad. Cada gema = 1 cristal + 4 puntos (semanas) ---- */
        var gemGeo = new THREE.IcosahedronGeometry(0.3, 0);
        var weekGeo = new THREE.SphereGeometry(0.09, 14, 14);
        var weekHaloGeo = new THREE.SphereGeometry(0.2, 14, 14);

        var gems = [];
        var weekPoints = [];

        UNIT_DATA.forEach(function (unit, gi) {
            var gemGroup = new THREE.Group();
            gemGroup.position.fromArray(GEM_POS[gi]);
            gemGroup.userData = { spin: 0.5 + Math.random() * 0.4 };

            var fillMesh = new THREE.Mesh(gemGeo, new THREE.MeshBasicMaterial({
                color: 0x6ffcc0, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
            var wireMesh = new THREE.Mesh(gemGeo, new THREE.MeshBasicMaterial({
                color: 0xc8f04a, wireframe: true, transparent: true, opacity: 0.32,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
            gemGroup.add(fillMesh, wireMesh);

            for (var j = 0; j < 4; j++) {
                var mesh = new THREE.Mesh(weekGeo, new THREE.MeshBasicMaterial({
                    color: 0xc8f04a, transparent: true, opacity: 1,
                    blending: THREE.AdditiveBlending, depthWrite: false
                }));
                mesh.position.fromArray(TETRA_OFFSETS[j]);
                mesh.userData = {
                    scale: 1, targetScale: 1,
                    data: {
                        week: unit.startWeek + j,
                        unitNum: unit.num,
                        unitTitle: unit.title,
                        href: unit.href
                    }
                };
                var halo = new THREE.Mesh(weekHaloGeo, new THREE.MeshBasicMaterial({
                    color: 0xc8f04a, transparent: true, opacity: 0.16,
                    blending: THREE.AdditiveBlending, depthWrite: false
                }));
                mesh.add(halo);
                gemGroup.add(mesh);
                weekPoints.push(mesh);
            }

            group.add(gemGroup);
            gems.push(gemGroup);
        });

        var raycaster = new THREE.Raycaster();
        var pointer = new THREE.Vector2(-10, -10);
        var hovered = null;
        var active = null;

        var label = document.createElement('div');
        label.className = 'hero-hotspot-label';
        label.innerHTML =
            '<span class="hero-hotspot-label__close" aria-hidden="true">&times;</span>' +
            '<span class="hero-hotspot-label__num"></span>' +
            '<span class="hero-hotspot-label__weeks"></span>' +
            '<span class="hero-hotspot-label__title"></span>' +
            '<a class="hero-hotspot-label__link" href="#">Ver unidad →</a>';
        document.body.appendChild(label);
        label.querySelector('.hero-hotspot-label__close').addEventListener('click', function () {
            setActive(null);
        });

        function setPointerFromEvent(e) {
            var rect = canvas.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function pickHotspot() {
            raycaster.setFromCamera(pointer, camera);
            var hits = raycaster.intersectObjects(weekPoints, false);
            return hits.length ? hits[0].object : null;
        }

        function pad2(n) { return n < 10 ? '0' + n : '' + n; }

        function setActive(mesh) {
            if (active && active !== mesh) active.userData.targetScale = (active === hovered ? 1.25 : 1);
            active = mesh;
            if (!mesh) {
                label.classList.remove('is-visible');
                return;
            }
            mesh.userData.targetScale = 1.5;
            var d = mesh.userData.data;
            label.querySelector('.hero-hotspot-label__num').textContent = pad2(d.week);
            label.querySelector('.hero-hotspot-label__weeks').textContent = 'Semana ' + pad2(d.week) + ' · Unidad ' + d.unitNum;
            label.querySelector('.hero-hotspot-label__title').textContent = d.unitTitle;
            label.querySelector('.hero-hotspot-label__link').setAttribute('href', d.href);
            label.classList.add('is-visible');
        }

        canvas.addEventListener('mousemove', function (e) {
            setPointerFromEvent(e);
            var hit = pickHotspot();
            if (hit !== hovered) {
                if (hovered && hovered !== active) hovered.userData.targetScale = 1;
                hovered = hit;
                if (hovered && hovered !== active) hovered.userData.targetScale = 1.25;
            }
            canvas.style.cursor = hit ? 'pointer' : '';
        });
        canvas.addEventListener('mouseleave', function () {
            if (hovered && hovered !== active) hovered.userData.targetScale = 1;
            hovered = null;
        });
        canvas.addEventListener('click', function (e) {
            setPointerFromEvent(e);
            var hit = pickHotspot();
            setActive(hit === active ? null : hit);
        });
        document.addEventListener('click', function (e) {
            if (active && e.target !== canvas) setActive(null);
        });

        /* ---- Resize ---- */
        function resize() {
            var w = mount.clientWidth || window.innerWidth;
            var h = mount.clientHeight || window.innerHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        var resizeTO;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTO);
            resizeTO = setTimeout(resize, 150);
        });

        /* ---- Parallax de mouse (lerp suave) ---- */
        var targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;
        window.addEventListener('mousemove', function (e) {
            targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.5;
            targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.3;
        });

        /* ---- Pausar cuando el hero no está visible o la pestaña está oculta ---- */
        var isVisible = true;
        var io = new IntersectionObserver(function (entries) {
            isVisible = entries[0].isIntersecting;
            if (!isVisible) setActive(null);
        }, { threshold: 0.01 });
        io.observe(mount);
        document.addEventListener('visibilitychange', function () {
            isVisible = isVisible && !document.hidden;
        });

        /* ---- Loop ---- */
        var clock = new THREE.Clock();
        var posArray = pointsGeo.attributes.position.array;
        var worldPos = new THREE.Vector3();

        function animate() {
            requestAnimationFrame(animate);
            if (document.hidden || !isVisible) return;

            var t = clock.getElapsedTime();

            // leve respiración de cada nodo alrededor de su posición base
            for (var n = 0; n < NODE_COUNT; n++) {
                posArray[n * 3 + 1] = basePositions[n * 3 + 1] + Math.sin(t * 0.4 + phases[n]) * 0.18;
                posArray[n * 3] = basePositions[n * 3] + Math.cos(t * 0.3 + phases[n]) * 0.12;
            }
            pointsGeo.attributes.position.needsUpdate = true;

            curRotX += (targetRotX - curRotX) * 0.04;
            curRotY += (targetRotY - curRotY) * 0.04;
            group.rotation.x = curRotX + Math.sin(t * 0.06) * 0.05;
            group.rotation.y = curRotY + t * 0.045;

            weekPoints.forEach(function (h, i) {
                h.material.opacity = 0.85 + Math.sin(t * 1.6 + i * 1.3) * 0.15;
                h.userData.scale += (h.userData.targetScale - h.userData.scale) * 0.15;
                h.scale.setScalar(h.userData.scale);
            });

            gems.forEach(function (g) {
                g.rotation.x += g.userData.spin * 0.006;
                g.rotation.y += g.userData.spin * 0.009;
            });

            renderer.render(scene, camera);

            if (active) {
                active.getWorldPosition(worldPos);
                var proj = worldPos.project(camera);
                var rect = canvas.getBoundingClientRect();
                var sx = (proj.x * 0.5 + 0.5) * rect.width + rect.left;
                var sy = (-proj.y * 0.5 + 0.5) * rect.height + rect.top;
                var margin = 12;
                sx = Math.min(Math.max(sx + 22, margin), window.innerWidth - 220 - margin);
                sy = Math.min(Math.max(sy - 10, margin), window.innerHeight - 130 - margin);
                label.style.left = sx + 'px';
                label.style.top = sy + 'px';
                label.classList.toggle('is-behind', proj.z > 1);
            }
        }
        animate();
    }

    /* ---- Textura circular con degradado suave para cada nodo ---- */
    function dotTexture(THREE) {
        var size = 64;
        var c = document.createElement('canvas');
        c.width = c.height = size;
        var ctx = c.getContext('2d');
        var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        var tex = new THREE.CanvasTexture(c);
        return tex;
    }
})();
