import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components", "features", "vuyela-design-system/src"];
const forbiddenCopy =
  /\b(?:Nao|nao|Administracao|Aprovacao|Navegacao|Cartoes|Negocios|Notificacoes|Subscricao|Beneficios|Mocambique|Paginacao|Inicio|Ola|Visao|Verificacao|Identificacao|Gestao|Criacao|Eliminacao|Fundacao|Acoes|Formularios|Interacao|Aplicacao|Introducao|Combinacao|Definicoes|Promocoes|Preparacao|actualiz\w*|activ[oa]s?|inactiv\w*|public[oa]s?|propri[oa]s?|necessari[oa]s?|proxim[oa]s?|pratic[oa]s?|minim[oa]s?|maxim[oa]s?|automatic[oa]s?|senha|senhas|premios?|elegiveis?|audiencias?|calendarios?|owner|owners|dashboard|Standard)\b/i;

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }

    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

function collectVisibleCopy(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const copy: string[] = [];

  function appendCopy(value: string): void {
    const normalized = value.trim();
    const looksTechnical = /^(?:\/|#|\.|@|https?:|[a-z0-9_@./?=&:#-]+$)/.test(normalized);

    if (normalized && !looksTechnical) {
      copy.push(normalized);
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isJsxText(node)) {
      appendCopy(node.text);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) {
        appendCopy(node.text);
      }
    } else if (ts.isTemplateExpression(node)) {
      appendCopy(node.head.text);
      node.templateSpans.forEach((span) => appendCopy(span.literal.text));
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return copy;
}

describe("Portuguese interface copy", () => {
  it("uses reviewed European Portuguese in user-visible text", () => {
    const failures = sourceRoots.flatMap((root) =>
      collectSourceFiles(join(process.cwd(), root)).flatMap((file) =>
        collectVisibleCopy(file)
          .filter((copy) => forbiddenCopy.test(copy))
          .map((copy) => `${file}: ${copy}`)
      )
    );

    expect(failures).toEqual([]);
  });
});
