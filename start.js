const { exec } = require('child_process');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
require('dotenv').config()

const ALIAS = process.env.ALIAS
const FILE = process.env.FILE_EXIST_FOLDER
const PATH_PROJECTS = process.env.PATH_PROJECTS
const INSTRUCION_NOT_FILE = process.env.INSTRUCION_NOT_FILE
const INSTRUCION_WITH_FILE = process.env.INSTRUCION_WITH_FILE

const listContainers = () => {
  return new Promise((resolve, reject) => {
    exec(`docker ps -a --filter "name=${ALIAS}" --filter "status=exited" --format "{{.Names}}"`, (err, stdout, stderr) => {
      if (err) {
        return reject(`Erro ao listar containers: ${stderr}`);
      }
      const containers = stdout.trim().split('\n').filter(Boolean);
      resolve(containers);
    });
  });
};

const formatContainerName = (name) => {
  const formattedName = name.replace(ALIAS, '');
  return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
};

const checkWatcherFile = (container) => {
  return new Promise((resolve, reject) => {
    if(!PATH_PROJECTS || !FILE){
      resolve(false)
    }
    const containerPath = `${PATH_PROJECTS}${container}`;
    fs.access(path.join(containerPath, FILE), fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
  const getInstructionForContainer = async (container) => {
    let containerMod = container.replace(ALIAS, '')

    const ONLY_START = (process.env.SERVICES_ONLY_START).split('|')
    const hasWatcher = await checkWatcherFile(containerMod);

    if (ONLY_START.includes(containerMod)) {
      return '';
    }
    if (!hasWatcher) {
      return INSTRUCION_NOT_FILE;
    }else{
      return INSTRUCION_WITH_FILE;
    }
  };
  

  const executeInstruction = (containers) => {
    containers.forEach(async container => {
      const instruction = await getInstructionForContainer(container);
      console.log(`Executando ${formatContainerName(container)}: ${instruction}`);
      let commandExec = '';
      if(instruction){
        commandExec = `docker start ${container} && docker exec ${container} ${instruction}`
      }else{
        commandExec = `docker start ${container}`
      }
      exec(commandExec, (err, stdout, stderr) => {
        if (err) {
          console.error(`Erro ao executar instrução no container ${container}: ${stdout}`);
        } else {
          console.log(`Resultado no container ${container}: ${stdout}`);
        }
      });
    });
  };


  const main = async () => {
    try {
      const containers = await listContainers();
      
      if (containers.length === 0) {
        console.log('Nenhum container disponível encontrado.');
        return;
      }

      const choices = containers.map(name => ({
        name: formatContainerName(name),
        value: name
      }));
  
      const { selectedContainers } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedContainers',
          message: 'Selecione os containers:',
          choices
        }
      ]);
  
      if (selectedContainers.length === 0) {
        console.log('Nenhum container selecionado.');
        return;
      }
  
      executeInstruction(selectedContainers);
    } catch (error) {
      console.error(error);
    }
  };

main();