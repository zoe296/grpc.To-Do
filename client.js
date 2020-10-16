const path = require('path');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const async = require('async');

const PROTO_PATH = path.join(__dirname, './protos/todo.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const toDoProto = grpc.loadPackageDefinition(packageDefinition).ToDoService;

const client = new toDoProto.ToDoService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);
const meta = new grpc.Metadata();
meta.add('token', 'Secret');

// Unary RPCs
function createToDo(callback) {
  const newToDo = {
    title: 'gg la',
    author: 'Zoe',
    isDone: false,
  };

  client.createToDo(newToDo, meta, function (err, toDoList) {
    if (err) {
      console.log('err: ', err);
      callback(err);
      return;
    }

    console.log('toDoList: ', toDoList);
    callback();
    console.log('=========end createToDo======');
  });
}

// Bidirectional streaming RPCs
function createMultiToDo(callback) {
  const call = client.createMultiToDo();
  call.on('data', function (toDoItem) {
    console.log('toDoItem: ', toDoItem);
  });

  call.on('end', function () {
    callback();
    console.log('=========end createMultiToDo======');
  });

  call.on('error', function (err) {
    console.log('err: ', err);
  });

  call.on('status', function (status) {
    console.log('status: ', status);
  });

  const todoList = [
    { title: 'abcdefg1', author: 'Adam', isDone: null },
    { title: 'abcdefg2', author: 'Ben', isDone: null },
    { title: 'abcdefg3', author: 'Ben', isDone: null },
    { title: 'omg1', author: 'Adam', isDone: null },
    { title: 'omg2', author: 'Cathy', isDone: null },
    { title: 'omg3', author: 'Ben', isDone: null },
  ];

  for (const todoItem of todoList) {
    call.write(todoItem);
  }
  call.end();
}

// Server streaming RPCs
function getToDoListByAuthor(callback) {
  const call = client.getToDoListByAuthor({ author: 'Ben' });

  call.on('data', function (toDoItem) {
    console.log('toDoItem: ', toDoItem);
  });

  call.on('end', function () {
    callback();
    console.log('=========end getToDoListByAuthor======');
  });
}

// Client streaming RPCs
function getToDoListByMultiAuthors(callback) {
  const call = client.getToDoListByMultiAuthors(function (err, toDoList) {
    if (err) {
      console.log('err: ', err);
      callback(err);
      return;
    }

    console.log('toDoList: ', toDoList);
    // callback();
    console.log('=========end getToDoListByMultiAuthors======');
  });

  const filters = [{ author: 'Adam' }, { author: 'Cathy' }];
  for (const filter of filters) {
    call.write(filter);
  }
  call.end();
}

// Server streaming RPCs
function listToDoItems(callback) {
  const call = client.listToDoItems();

  // read the server’s responses
  call.on('data', function (toDoItem) {
    console.log('toDoItem: ', toDoItem);
  });

  // The server has finished sending
  call.on('end', function () {
    callback();
    console.log('=========end listToDoItems======');
  });

  // An error has occurred and the stream has been closed.
  call.on('error', function (err) {
    console.log('err: ', err);
  });

  // process status
  call.on('status', function (status) {
    console.log('status: ', status);
  });
}

function main() {
  async.series([
    createToDo,
    createMultiToDo,
    getToDoListByAuthor,
    getToDoListByMultiAuthors,
    listToDoItems,
  ]);
}

main();
