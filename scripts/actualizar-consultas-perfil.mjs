// Run from the project's root: node scripts/actualizar-consultas-perfil.mjs
// Only modifies literal SELECT projections for character_customizations.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const roots = ['app', 'components', 'lib', 'src/app', 'src/components', 'src/lib'].filter(existsSync);
if (!existsSync('package.json') || roots.length === 0) {
  console.error('Ejecuta este script desde la raíz de Gema Brillante (junto a package.json).');
  process.exit(1);
}
let found = 0, changes = 0, warnings = 0;
const query = /(\.from\(\s*(['"])character_customizations\2\s*\)\s*\.select\(\s*)(['"`])([\s\S]*?)\3/g;
const anySelect = /\.from\(\s*(['"])character_customizations\1\s*\)\s*\.select\(/g;
function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) { if (!['node_modules','.next','.git'].includes(ent.name)) walk(path); continue; }
    if (!ent.isFile() || !/\.[jt]sx?$/.test(ent.name)) continue;
    const original = readFileSync(path, 'utf8');
    const selectCount = [...original.matchAll(anySelect)].length;
    let literalCount = 0;
    const next = original.replace(query, (all, prefix, tableQuote, quote, projection) => {
      literalCount++;
      if (projection.trim() === '*') { found++; console.log('YA INCLUYE TODO:', path); return all; }
      if (!/^[\w,\s]+$/.test(projection)) {
        console.warn('REVISAR CONSULTA NO SIMPLE:', path); warnings++; return all;
      }
      const cols = projection.split(',').map(s=>s.trim()).filter(Boolean);
      if (!cols.includes('theme')) return all;
      found++;
      const missing = ['night_theme','night_accent_color'].filter(c=>!cols.includes(c));
      if (!missing.length) { console.log('YA ACTUALIZADO:', path); return all; }
      let body = projection.trimEnd().replace(/,\s*$/, '');
      const trailing = projection.slice(projection.trimEnd().length);
      body += ', ' + missing.join(', ');
      changes++;
      console.log('ACTUALIZADO:', path);
      return prefix + quote + body + trailing + quote;
    });
    if (selectCount > literalCount) { warnings++; console.warn('REVISAR SELECT DINÁMICO:', path); }
    if (next !== original) writeFileSync(path,next,'utf8');
  }
}
for (const dir of roots) walk(dir);
console.log(`\nConsultas de personalización: ${found}. Cambiadas: ${changes}. Avisos: ${warnings}.`);
if (!found || warnings) { console.warn('Revisa los avisos antes de publicar.'); process.exitCode = 1; }
