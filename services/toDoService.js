const grpc = require("grpc");

let todoList = [
  { title: "Hello1", author: "Adam", isDone: true },
  { title: "Hello2", author: "Ben", isDone: null },
  { title: "Hello3", author: "Ben", isDone: true },
  { title: "world1", author: "Adam", isDone: null },
  { title: "world2", author: "Cathy", isDone: true },
  { title: "world3", author: "Ben", isDone: null },
];

function createToDo(call, callback) {
  console.log("=========start createToDo=========");

  const clientToken = call.metadata.get("token");
  if (clientToken[0] !== "Secret") {
    return callback({
      error: grpc.status.PERMISSION_DENIED,
      message: "No token",
    });
  }
  todoList.push(call.request);

  if (todoList.length > 10) {
    return callback({
      error: grpc.status.OUT_OF_RANGE,
      message: "too many ToDoItem",
    });
  }

  callback(null, {
    ToDoList: todoList,
  });

  console.log("=========end createToDo=========");
}

async function createMultiToDo(call, callback) {
  console.log("=========start createMultiToDo=========");

  call.on("data", (data) => {
    todoList.push(data);

    // if (todoList.length > 10) {
    //   return call.emit("error", grpc.status.OUT_OF_RANGE);
    // }
  });

  call.on("end", () => {
    listToDoItems(call);

    console.log("=========end createMultiToDo=========");
  });
}

function getToDoListByAuthor(call) {
  console.log("=========start getToDoListByAuthor=========");

  const author = call.request.author;

  async function main() {
    let isAny = false;
    for (const todoItem of todoList) {
      if (author === todoItem.author) {
        isAny = true;
        call.write(todoItem);
        await wait(1);
      }
    }

    if (isAny === false) {
      return call.emit("error", grpc.status.NOT_FOUND);
    }

    call.end();
    console.log("=========end getToDoListByAuthor=========");
  }

  main();
}

async function getToDoListByMultiAuthors(call, callback) {
  console.log("=========start getToDoListByMultiAuthors=========");

  let res = [];
  call.on("data", (data) => {
    const items = todoList.filter((i) => i.author === data.author);
    res.push(...items);
  });

  call.on("end", () => {
    callback(null, {
      ToDoList: res,
    });

    console.log("=========end getToDoListByMultiAuthors=========");
  });
}

async function listToDoItems(call) {
  console.log("=========start listToDoItems=========");

  for (const todoItem of todoList) {
    call.write(todoItem);
    await wait(1);
  }

  call.end();

  console.log("=========end listToDoItems=========");
}

async function wait(sec) {
  return new Promise((res) => setTimeout(() => res(), sec * 1000));
}

module.exports = {
  createToDo,
  createMultiToDo,
  getToDoListByAuthor,
  getToDoListByMultiAuthors,
  listToDoItems,
};
