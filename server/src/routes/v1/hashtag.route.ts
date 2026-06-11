import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { limitter } from "@/middlewares/limitter.middleware";
import { hashtagLimit } from "@/config/constant/hashtag.constant";
import { HashtagController as ctrl } from "@/modules/hashtags/hashtag.controller";

const hashtag = new Hono();

hashtag.get("/trending", protect, limitter(hashtagLimit.GET_TRENDING), ctrl.getTrending);
hashtag.get("/:name/posts", protect, limitter(hashtagLimit.GET_HASHTAG_POSTS), ctrl.getPostsByHashtag);

export default hashtag;
