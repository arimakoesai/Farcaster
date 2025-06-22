import Cors from "cors";
import initMiddleware from "../utils/init-middleware";

const cors = initMiddleware(
  Cors({
    origin: "*",
    methods: ["POST", "OPTIONS"],
  })
);

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { fid, address, username, auction_id } = req.body;
  const API_KEY =
    "7928227064ff5fbd952120a972e3887d0dc88e9186a21e8c2ced7aa68068fd1c";

  const headers = {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://qrcoin.fun",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
    "x-api-key": API_KEY,
  };

  const payload = {
    fid,
    address,
    username,
    auction_id: Number(auction_id),
    winning_url: `https://qrcoin.fun/auction/${auction_id}`,
    claim_source: "mini_app",
  };

  try {
    const response = await fetch("https://qrcoin.fun/api/link-visit/claim", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: "Gagal klaim", error: err.message });
  }
}
