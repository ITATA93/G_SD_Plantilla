/**
 * Generador de Modulos CRUD
 *
 * Usa Plop.js para generar la estructura de nuevos modulos.
 * Ejecutar: npm run generate:module nombre-modulo
 */

export default function (plop) {
  plop.setGenerator('module', {
    description: 'Genera un nuevo modulo CRUD',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nombre del modulo (en singular, ej: paciente):',
      },
      {
        type: 'input',
        name: 'namePlural',
        message: 'Nombre en plural (ej: pacientes):',
      },
      {
        type: 'confirm',
        name: 'withFhir',
        message: 'Incluir integracion FHIR (para modulos de salud)?',
        default: false,
      },
    ],
    actions: (data) => {
      const actions = [
        // Controller
        {
          type: 'add',
          path: 'src/modules/{{dashCase name}}/controllers/{{dashCase name}}.controller.ts',
          templateFile: 'plop-templates/controller.ts.hbs',
        },
        // Service
        {
          type: 'add',
          path: 'src/modules/{{dashCase name}}/services/{{dashCase name}}.service.ts',
          templateFile: 'plop-templates/service.ts.hbs',
        },
        // Repository
        {
          type: 'add',
          path: 'src/modules/{{dashCase name}}/repositories/{{dashCase name}}.repository.ts',
          templateFile: 'plop-templates/repository.ts.hbs',
        },
        // DTOs
        {
          type: 'add',
          path: 'src/modules/{{dashCase name}}/dto/{{dashCase name}}.dto.ts',
          templateFile: 'plop-templates/dto.ts.hbs',
        },
        // Routes
        {
          type: 'add',
          path: 'src/modules/{{dashCase name}}/routes/{{dashCase name}}.routes.ts',
          templateFile: 'plop-templates/routes.ts.hbs',
        },
        // Index
        {
          type: 'add',
          path: 'src/modules/{{dashCase name}}/index.ts',
          templateFile: 'plop-templates/index.ts.hbs',
        },
      ];

      return actions;
    },
  });
}
