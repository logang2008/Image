import { auth } from "@/auth"
import { isValidApiToken } from "@/lib/apiToken"


const ROOT = '/';
const PUBLIC_ROUTES = ['/'];
const DEFAULT_REDIRECT = '/login';
const LOGIN = '/login'
const API_ADMIN = "/api/admin"
const ADMIN_PAGE = "/admin"
const AUTH_API = "/api/enableauthapi"
const enableAuthapi = process.env.ENABLE_AUTH_API === 'true';

export default auth(async (req) => {
    const { nextUrl } = req;

    // console.log(req?.auth?.user?.role);
    const role = req?.auth?.user?.role;



    const isAuthenticated = !!req.auth;
    const isAPI_ADMIN = nextUrl.pathname.startsWith(API_ADMIN);
    const isADMIN_PAGE = nextUrl.pathname.startsWith(ADMIN_PAGE);

    const isAuthAPI = nextUrl.pathname.startsWith(AUTH_API);

    if (!isAuthenticated) {
        if (isAPI_ADMIN) {
            return Response.json(
                { status: "fail", message: "You are not logged in by admin !", success: false },
                { status: 401 },
            )
        }
        else if (isADMIN_PAGE) {
            return Response.redirect(new URL(LOGIN, nextUrl));
        }
        else if (isAuthAPI) {

            // API token 通道：携带有效 token（登录后经 /api/user/token 领取）的请求直接放行，
            // 不受 ENABLE_AUTH_API 开关影响（与 requireLogin 保持一致）
            if (await isValidApiToken(req)) {
                return
            }

            if (enableAuthapi) {
                return Response.json(
                    { status: "fail", message: "You are not logged in by user !", success: false },
                    { status: 401 }
                );
            }
            else {
                return
            }
        }

        else {
            return

        }
    }

    if (role === 'admin') {
        return;
    }

    if (role === 'user') {
        if (isAPI_ADMIN || isADMIN_PAGE) {
            return Response.redirect(new URL(LOGIN, nextUrl));

        }
    }

})

// 使用静态 matcher 配置
export const config = {
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*",
        "/api/enableauthapi/:path*"
    ],
};