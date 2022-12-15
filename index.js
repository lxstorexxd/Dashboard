const http = require("http");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const express = require('express');
// const bodyParser = require('body-parser');
const jsonfile = require("jsonfile");
const app = express();

const server = http.createServer(app);
const port = 3000;
// const urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(cors());
app.use(morgan("dev"));
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.use(express.static("views")); //указываем папку с основными файлами
// ---

const path_json = path.join(__dirname, "/data.json") //указываем путь до бд
const work_status = {1: "wait", 2: "active", 3: "complet"} //3 столбца

function parameters() {
	return {
		Task: jsonfile.readFileSync(path_json) //возвращаются данные файла
	}
}

function generate_task() { // функция генерации имени
	let key = 1;
	let unpos = []; //список для хранения занятых id задач 
	for (let j=0;j<parameters().Task.length;j++) {
		unpos.push(parameters().Task[j].task_id); //добавление в список занятых позиций
	}
	
	while(true) {
		if(unpos.find(i => (i === key))) key++; //проверка существующих id
		else return key;
	}
}

app.post('/dashboard/addtask', function(request, response) {
	let data = request.body;
	let new_data_task = {
		"task_id": generate_task(),
		"task_name": data.head,
		"task_description": data.desc,
		"task_date": data.date,
		"task_author": data.author,
		"task_status": "wait"
	};
	
	jsonfile.readFile(path_json, (error, object) => { //чтение всех задач
		if (error) throw error
		object.push(new_data_task); //добавление новой задачи ко всем
		jsonfile.writeFile(path_json, object, { spaces: 2 }, (error) => { //запись всего
			if (error) throw error;
		});
	});
	response.redirect(303, '/dashboard'); //возвращает домой
})

app.post('/dashboard/removetask/', function (request, response) {
	jsonfile.readFile(path_json, (error, object) => {
		if (error) throw error
		for(let i = 0; i < object.length; i++) {
			if (object[i].task_status == "complet") { //проверка на наличие в 3 столбце
				object.splice(i, 1)
				i--;
			}
		}
    jsonfile.writeFile(path_json, object, { spaces: 2 }, (error) => { //записываем новый список
      if (error) throw error;
    });
  });
  response.redirect(303, '/dashboard');
});

app.post('/api/editstatus', function (request, response) {
	jsonfile.readFile(path_json, (error, object) => {
		if (error) throw error
		for(let i = 0; i < object.length; i++) {
			if (object[i].task_id == request.body.block_id) { //
				object[i].task_status = work_status[request.body.field];
			}
		}
		jsonfile.writeFile(path_json, object, { spaces: 2 }, (error) => {
			if (error) throw error;
		});
	});
	response.sendStatus(303);
});

app.get('/dashboard', function (request, response) { //загрузка страницы
	response.render('dashboard', parameters());
})

// ---
server.listen(port, () => {
	console.log("\x1b[35m%s\x1b[0m", `The server is running on the port ${port}`);
	console.log("\x1b[32m%s\x1b[0m", `http://localhost:${port}/`);
});




