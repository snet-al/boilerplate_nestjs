require('dotenv').config()
import { DataSource } from 'typeorm'

const getConnectionType = (type: any) => {
  switch (type) {
    case 'mysql':
    case 'mssql':
    case 'postgres':
    case 'mariadb':
    case 'mongodb':
      return type
    default:
      return 'mysql'
  }
}

const ormconfiguration = {
  type: getConnectionType(process.env.TYPEORM_CONNECTION),
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [process.env.TYPEORM_ENTITIES],
  migrations: [process.env.TYPEORM_MIGRATIONS],
}

const ormconfig = new DataSource(ormconfiguration)
export { ormconfiguration }
export default ormconfig
