import Cors from "cors";
import initMiddleware from "../utils/init-middleware";

const cors = initMiddleware(
  Cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
  })
);

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username diperlukan" });

  try {
    const url = `https://explorer.neynar.com/api/neynar/user/by_username?username=${username}`;
    const response = await fetch(url);
    const json = await response.json();

    const user = json.user;
    if (!user || !user.verified_addresses?.primary?.eth_address) {
      return res
        .status(404)
        .json({ error: "User tidak ditemukan atau tidak punya address" });
    }

    return res.status(200).json({
      fid: user.fid,
      address: user.verified_addresses.primary.eth_address,
      username: user.username,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Gagal ambil data dari Neynar", detail: err.message });
  }
}
