// --------------------------------------------------
// Estado global
// --------------------------------------------------
const state = {
  recipes: [],
  categories: [],
  installPromptEvent: null
};

const app = document.querySelector('#app');

// Placeholder de imagen
const placeholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="100%" height="100%" fill="#e2e8f0"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#334155" font-family="Inter,Arial" font-size="22">
      Imagen no disponible
    </text>
  </svg>`);

function imgOrPlaceholder(src) {
  return new Promise(resolve => {
    const i = new Image();
    i.onload = () => resolve(src);
    i.onerror = () => resolve(placeholder);
    i.src = src;
  });
}

// --------------------------------------------------
// Carga de recetas + generación dinámica de categorías
// --------------------------------------------------
async function loadRecipes() {
  if (state.recipes.length) return state.recipes;

  try {
    const res = await fetch('data/recipes.json');
    const data = await res.json();
    state.recipes = data;

    // Generar categorías dinámicamente
    const map = new Map();

    data.forEach(r => {
      const slug = r.category;
      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          name: slug.charAt(0).toUpperCase() + slug.slice(1),
          img: `assets/img/categorias/${slug}.jpg`
        });
      }
    });

    state.categories = Array.from(map.values());
    return data;

  } catch (e) {
    console.error('Error cargando recipes.json', e);
    return [];
  }
}

// --------------------------------------------------
// Enrutado simple por hash
// --------------------------------------------------
function route() {
  const h = location.hash || '#/';
  const p = h.slice(2).split('/').filter(Boolean);

  if (!p.length) return { n: 'home' };
  if (p[0] === 'categoria' && p[1]) return { n: 'cat', slug: p[1] };
  if (p[0] === 'receta' && p[1]) return { n: 'rec', id: p[1] };

  return { n: '404' };
}

// --------------------------------------------------
// Render principal
// --------------------------------------------------
async function render() {
  await loadRecipes();
  const r = route();

  if (r.n === 'home') return renderHome();
  if (r.n === 'cat') return renderCat(r.slug);
  if (r.n === 'rec') return renderRec(r.id);

  render404();
}

// --------------------------------------------------
// Home (categorías)
// --------------------------------------------------
async function renderHome() {
  const cards = await Promise.all(
    state.categories.map(async c => {
      const img = await imgOrPlaceholder(c.img);
      return `
        <a href="#/categoria/${c.slug}"
           class="block overflow-hidden rounded-xl border bg-white dark:bg-slate-800
                  border-slate-200 dark:border-slate-700 hover:shadow">
          <div class="aspect-[16/9] relative">
            <img src="${img}" alt="${c.name}"
                 class="w-full h-full object-cover"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <h2 class="absolute bottom-3 left-3 text-white text-xl font-semibold">
              ${c.name}
            </h2>
          </div>
        </a>`;
    })
  );

  app.innerHTML = `
    <section class="space-y-6">
      <h1 class="text-2xl md:text-3xl font-bold">Elige una categoría</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        ${cards.join('')}
      </div>
    </section>`;
}

// --------------------------------------------------
// Listado por categoría
// --------------------------------------------------
async function renderCat(slug) {
  const list = state.recipes.filter(r => r.category === slug);

  if (!list.length) {
    app.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Sin recetas</h1>
          <a href="#/" class="text-brand">Volver</a>
        </div>
        <p class="text-slate-600">
          No hay recetas para esta categoría.
        </p>
      </div>`;
    return;
  }

  const cards = await Promise.all(
    list.map(async r => {
      const img = await imgOrPlaceholder(r.image || '');
      return `
        <a href="#/receta/${r.id}"
           class="block overflow-hidden rounded-xl border bg-white dark:bg-slate-800
                  border-slate-200 dark:border-slate-700 hover:shadow">
          <div class="aspect-[16/9] relative">
            <img src="${img}" alt="${r.title}"
                 class="w-full h-full object-cover"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div class="absolute bottom-3 left-3 right-3">
              <h3 class="text-white text-lg font-semibold">${r.title}</h3>
              <p class="text-white/90 text-sm">${r.description || ''}</p>
            </div>
          </div>
        </a>`;
    })
  );

  const name =
    state.categories.find(c => c.slug === slug)?.name || 'Categoría';

  app.innerHTML = `
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl md:text-3xl font-bold">${name}</h1>
        <a href="#/" class="text-brand">← Volver</a>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        ${cards.join('')}
      </div>
    </section>`;
}

// --------------------------------------------------
// Ficha de receta
// --------------------------------------------------
async function renderRec(id) {
  const r = state.recipes.find(x => String(x.id) === String(id));
  if (!r) return render404();

  const img = await imgOrPlaceholder(r.image || '');
  const steps = r.steps || [];
  const ing = r.ingredients || [];

  app.innerHTML = `
    <article class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl md:text-3xl font-bold">${r.title}</h1>
        <a href="#/categoria/${r.category}" class="text-brand">← Volver</a>
      </div>

      <div class="overflow-hidden rounded-xl border bg-white dark:bg-slate-800
                  border-slate-200 dark:border-slate-700">
        <img src="${img}" alt="${r.title}"
             class="w-full aspect-[16/9] object-cover"/>

        <div class="p-4 md:p-6 space-y-4">
          <p class="text-slate-700 dark:text-slate-300">
            ${r.description || ''}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section class="md:col-span-1">
              <h2 class="text-lg font-semibold mb-2">Ingredientes</h2>
              <ul class="list-disc list-inside space-y-1">
                ${ing.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </section>

            <section class="md:col-span-2">
              <h2 class="text-lg font-semibold mb-2">Elaboración paso a paso</h2>
              <ol class="space-y-3">
                ${steps.map((s, i) => `
                  <li class="flex items-start gap-3 p-3 rounded-lg
                             bg-slate-100 dark:bg-slate-800/60">
                    <span class="inline-flex w-8 h-8 rounded-full bg-brand
                                 text-white items-center justify-center font-semibold">
                      ${i + 1}
                    </span>
                    <div class="flex-1"><p>${s}</p></div>
                    <label class="ml-auto inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" class="rounded" data-step="${i}"/>
                      Hecho
                    </label>
                  </li>`).join('')}
              </ol>

              <div class="mt-4 flex items-center gap-3">
                <progress id="progress" max="${steps.length}" value="0"
                          class="w-full"></progress>
                <span id="progressText"
                      class="text-sm text-slate-600">
                  0 / ${steps.length}
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>`;

  const checks = app.querySelectorAll('input[type="checkbox"][data-step]');
  const prog = document.querySelector('#progress');
  const txt = document.querySelector('#progressText');

  function updateProgress() {
    const done = Array.from(checks).filter(c => c.checked).length;
    prog.value = done;
    txt.textContent = `${done} / ${steps.length}`;
  }

  checks.forEach(c => c.addEventListener('change', updateProgress));
  updateProgress();
}

// --------------------------------------------------
// 404
// --------------------------------------------------
function render404() {
  app.innerHTML = `
    <div class="space-y-4">
      <h1 class="text-2xl font-bold">Página no encontrada</h1>
      <a href="#/" class="text-brand">Ir al inicio</a>
    </div>`;
}

// --------------------------------------------------
// Eventos
// --------------------------------------------------
window.addEventListener('hashchange', render);
window.addEventListener('load', render);

// --------------------------------------------------
// Instalación PWA
// --------------------------------------------------
const installBtn = document.querySelector('#installBtn');

function updateInstallBtn() {
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  if (isSafari) {
    installBtn.textContent = 'Añadir a inicio (Safari)';
    installBtn.disabled = true;
    installBtn.title = 'Usa Compartir → Añadir a pantalla de inicio';
    return;
  }
  installBtn.disabled = !state.installPromptEvent;
  installBtn.title = state.installPromptEvent
    ? 'Instalar PWA'
    : 'Aún no disponible (navega un poco)';
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  state.installPromptEvent = e;
  updateInstallBtn();
});

installBtn.addEventListener('click', async () => {
  if (!state.installPromptEvent) return;
  installBtn.disabled = true;
  try {
    await state.installPromptEvent.prompt();
  } finally {
    state.installPromptEvent = null;
    updateInstallBtn();
  }
});

updateInstallBtn();
