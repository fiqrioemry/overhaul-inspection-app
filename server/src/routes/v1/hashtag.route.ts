import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { limitter } from "@/middlewares/limitter.middleware";
import { hashtagLimit } from "@/config/constant/hashtag.constant";
import { HashtagController as ctrl } from "@/modules/hashtags/hashtag.controller";

const hashtag = new Hono();

export default hashtag;
