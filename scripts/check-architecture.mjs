import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'
import ts from 'typescript'

const sourceRoot = join(process.cwd(), 'src')
const failures = []

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    return entry.isDirectory() ? collectFiles(path) : [path]
  })
}

function report(file, message) {
  failures.push(`${relative(process.cwd(), file)}: ${message}`)
}

function isInside(directory, path) {
  const distance = relative(directory, path)

  return distance !== ''
    && !distance.startsWith('..')
    && !isAbsolute(distance)
}

function checkImports(file, componentDirectories) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)
      && !ts.isExportDeclaration(statement)) {
      continue
    }

    const specifier = statement.moduleSpecifier?.text

    if (!specifier?.startsWith('.')) {
      continue
    }

    const target = join(dirname(file), specifier)

    for (const directory of componentDirectories) {
      if (!isInside(directory, file) && isInside(directory, target)
        && target !== join(directory, 'index')) {
        report(file, 'Access other components through their public index.ts.')
      }
    }
  }
}

function checkComponent(file) {
  const name = basename(file, '.tsx')
  const directory = dirname(file)
  const publicFile = join(directory, 'index.ts')
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  if (basename(directory) !== name) {
    report(file, 'Use <Component>/<Component>.tsx.')
  }

  if (!existsSync(publicFile)) {
    report(file, 'Add index.ts with public component and type exports.')
  } else {
    const publicSource = ts.createSourceFile(
      publicFile,
      readFileSync(publicFile, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )
    const exportsComponent = publicSource.statements.some((statement) => {
      if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) {
        return false
      }

      return statement.moduleSpecifier?.text === `./${name}`
    })

    if (!exportsComponent) {
      report(publicFile, `Re-export ${name} from './${name}'.`)
    }
  }

  for (const statement of source.statements) {
    if (ts.isInterfaceDeclaration(statement)
      || ts.isTypeAliasDeclaration(statement)) {
      report(file, 'Move public interfaces into index.ts or types/.')
    }

    if (ts.isFunctionDeclaration(statement)
      && statement.name?.text !== name) {
      report(file, 'Move module-level utilities into helpers/.')
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const isComponent = ts.isIdentifier(declaration.name)
          && declaration.name.text === name
          && declaration.initializer
          && (ts.isArrowFunction(declaration.initializer)
            || ts.isCallExpression(declaration.initializer))

        if (!isComponent) {
          report(file, 'Move module-level constants into constants/.')
        }
      }
    }
  }
}

if (existsSync(sourceRoot)) {
  const files = collectFiles(sourceRoot)
  const components = []

  for (const file of files) {
    const isTest = /\.(test|spec)\.tsx?$/.test(file)
    const isEntry = file === join(sourceRoot, 'main.tsx')

    if (file.endsWith('.tsx') && !isTest && !isEntry) {
      checkComponent(file)
      components.push(dirname(file))
    }
  }

  for (const file of files) {
    if (/\.tsx?$/.test(file)) {
      checkImports(file, components)
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Component folders and public interfaces verified.')
}
