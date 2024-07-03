# Initalize many services
## _For projects with many containers that execute instructions depending on the service._

_The project using with context microservices using [hyperf]_ 🚀

## Installation ⚡

Install all dependences
```sh
npm install
```

## Settings ⚙️
Rename file .env default to .env and edit your preference.
If the container have alias Ex: service-db, add "service-" at the value. Ex:
```sh
ALIAS=hyperf-
```
File name to verify if exist Ex:
```sh
FILE_EXIST_FOLDER='.watcher.php'
```

Path the projects Ex:
```sh
PATH_PROJECTS='C:\\Projetos\\services\\'
```

Services only initiated. Have to splitting by "|"
```sh
SERVICES_ONLY_START='db|redis'
```

If not exist file in the service the folder, have to execut instruction. Ex:
```sh
INSTRUCION_NOT_FILE='php bin/hyperf.php start'
```

If exist file in the service the folder, have to execut instruction. Ex:
```sh
INSTRUCION_WITH_FILE='php bin/hyperf.php server:watch'
```
Terminal by used for show log selected Ex:
```sh
TERMINAL_WINDOWS='cmd.exe'
```
Ignored services selection list Ex:
```sh
SERVICES_IGNORE='db|redis'
```

## Using 🌟
Execute command:
```sh
node start.js
```

Select the services you want to launch;


## Author 🧑

- [@brunotrinchao](https://github.com/brunotrinchao)

## License 📃

MIT

   [hyperf]: <https://github.com/hyperf/hyperf>
  
