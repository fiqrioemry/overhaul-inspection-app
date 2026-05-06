import { SQL } from "bun";
import dbConfig from "../constant/database";

const db = new SQL(dbConfig.dbUrl);

export default db;
