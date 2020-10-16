const path = require('path');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const toDoService = require('./services/toDoService');

const PROTO_PATH = path.join(__dirname, './protos/todo.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, // Preserve field names. The default is to change them to camel case.
  longs: String, // The type to use to represent long values. Defaults to a Long object type.
  enums: String, // The type to use to represent enum values. Defaults to the numeric value.
  defaults: true, // Set default values on output objects. Defaults to false.
  oneofs: true, // Set virtual oneof properties to the present field's name. Defaults to false.
  // arrays: false,    // Set empty arrays for missing array values even if defaults is false Defaults to false.
  // objects: false,   // Set empty objects for missing object values even if defaults is false Defaults to false.
});
const toDoProto = grpc.loadPackageDefinition(packageDefinition).ToDoService;

async function main() {
  const server = new grpc.Server();
  server.addService(toDoProto.ToDoService.service, toDoService);
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  server.start();

  console.log('=========start=========');
}

main();
