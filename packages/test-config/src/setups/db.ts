import { MongoMemoryServer } from "mongodb-memory-server"

let instance: MongoMemoryServer | undefined

export async function getMongoMemoryServer(): Promise<MongoMemoryServer> {
  if (!instance) {
    instance = await MongoMemoryServer.create()
  }
  return instance
}

export async function stopMongoMemoryServer(): Promise<void> {
  if (instance) {
    await instance.stop()
    instance = undefined
  }
}
