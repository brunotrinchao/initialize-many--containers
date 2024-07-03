const { exec } = require('child_process');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config()

const ALIAS = process.env.ALIAS
const FILE = process.env.FILE_EXIST_FOLDER
const PATH_PROJECTS = process.env.PATH_PROJECTS
const INSTRUCION_NOT_FILE = process.env.INSTRUCION_NOT_FILE
const INSTRUCION_WITH_FILE = process.env.INSTRUCION_WITH_FILE
const TERMINAL_WINDOWS = process.env.TERMINAL_WINDOWS;
const SERVICES_IGNORE = process.env.SERVICES_IGNORE;

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
  

  const executeInstruction = (containers, containerLog) => {
    return Promise.all(
      containers.map(async (container) => {
        const instruction = await getInstructionForContainer(container);
        console.log(`Executando ${formatContainerName(container)}: ${instruction}`);
        let commandExec = '';
        if (instruction) {
          commandExec = `docker start ${container} && docker exec ${container} ${instruction}`;
        } else {
          commandExec = `docker start ${container}`;
        }
        return new Promise((resolve, reject) => {
          if(containerLog.includes(container)){
            const platform = os.platform();
            console.log(platform)
            if (platform === 'win32') {
              terminalCommand = `start ${TERMINAL_WINDOWS} /k "title Logs for ${containerLog} && ${commandExec} && docker logs -f ${containerLog}"`;
            } else if (platform === 'linux') {
              terminalCommand = `gnome-terminal --title="Logs for ${containerLog}" -- bash -c "${commandExec} && docker logs -f ${containerLog}; exec bash"`;
            } else {
              console.error(`Plataforma ${platform} não suportada para abrir uma nova aba do terminal.`);
              return;
            }
            exec(terminalCommand, (err) => {
              if (err) {
                console.error(`Erro ao visualizar logs do container ${containerLog} no Windows: ${err}`);
              }
            });
  
          }else{
  
            exec(commandExec, (err, stdout, stderr) => {
              if (err) {
                console.error(`Erro ao executar instrução no container ${container}: ${stderr}`);
                reject(err);
              } else {
                console.log(`Resultado no container ${container}: ${stdout}`);
                resolve(stdout);
              }
            });
        }
        });
      })
    );
  };

  
  const sortExecution = (selectedContainers, selectedContainerLog) => {
    return [...selectedContainerLog,...selectedContainers.filter(container => !selectedContainerLog.includes(container))]
  }

  const main = async () => {
    try {
      let servIgnore  = SERVICES_IGNORE.split('|').map(el => `${ALIAS}${el.toLowerCase()}`)

      const containers = (await listContainers()).filter((el) => !servIgnore.includes(el))

      
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

      const { selectedContainerLog } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedContainerLog',
          message: 'Selecione o container para visualizar os logs:',
          choices: selectedContainers.map((name) => ({
              name: formatContainerName(name),
              value: name,
            }))
        },
      ]);
  
      const selectedContainersFiltered = sortExecution(selectedContainers, selectedContainerLog);
      const novo = [...selectedContainerLog,...selectedContainers.filter(container => !selectedContainerLog.includes(container))]

      await executeInstruction(selectedContainersFiltered, selectedContainerLog);
    } catch (error) {
      console.error(error);
    }

  };

main();