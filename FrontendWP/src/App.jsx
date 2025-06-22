import { useState } from "react";
import {
  Input,
  Button,
  Form,
  Table,
  Progress,
  Typography,
  Layout,
  Row,
  Col,
  message,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import "antd/dist/reset.css";

const { TextArea } = Input;
const { Title } = Typography;
const { Content } = Layout;

export default function Home() {
  const [auctionId, setAuctionId] = useState("");
  const [usernameText, setUsernameText] = useState("");
  const [proxyText, setProxyText] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getUserData = async (username) => {
    try {
      const res = await fetch(
        `https://backend-wp-gold.vercel.app/api/userdata?username=${username}`
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    } catch (err) {
      return { username, error: "Gagal ambil user atau tidak ada address" };
    }
  };

  const claimQR = async (user, auctionId) => {
    const payload = {
      fid: user.fid,
      address: user.address,
      username: user.username,
      auction_id: Number(auctionId),
    };

    let retries = 10;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(
          "https://backend-wp-gold.vercel.app/api/claim",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();

        if (data.success && data.tx_hash) {
          return `✅ Berhasil Claim: https://basescan.org/tx/${data.tx_hash}`;
        }

        if (data.error?.toLowerCase().includes("already claimed")) {
          return "⚠️ already claimed";
        }

        if (data.error?.toLowerCase().includes("rate limit")) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        return `❌ Gagal: ${data.error || "Unknown error"}`;
      } catch (err) {
        if (attempt === retries - 1) {
          return `❌ Error: ${err.message}`;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return "❌ Error: Retry limit reached";
  };

  const handleSubmit = async () => {
    if (!auctionId || !usernameText.trim()) {
      message.warning("Auction ID dan username tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setProgress(0);

    const usernames = usernameText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 50);

    const tempResults = usernames.map((username) => ({
      key: username,
      username,
      status: "",
      proxy: "-", // updated later from backend response
    }));
    setResults(tempResults);

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];

      setResults((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: "⏳ Sedang diproses..." };
        return updated;
      });

      const user = await getUserData(username);

      let status;
      let proxyUsed = "-";
      if (user.error || !user.address) {
        status = "❌ Gagal ambil user atau tidak ada address";
      } else {
        const response = await claimQR(user, auctionId);
        status = typeof response === "object" ? response.status : response;
        proxyUsed = typeof response === "object" ? response.proxy || "-" : "-";
      }

      setResults((prev) => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status,
          proxy: proxyUsed,
        };
        return updated;
      });

      setProgress(Math.round(((i + 1) / usernames.length) * 100));
      await new Promise((r) => setTimeout(r, 2000));
    }

    setIsLoading(false);
  };

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Auction",
      dataIndex: "auction",
      key: "auction",
      render: () => auctionId,
    },
    {
      title: "SOCKS5",
      dataIndex: "proxy",
      key: "proxy",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => {
        let color = "red";
        if (text.includes("Berhasil")) color = "green";
        else if (text.includes("Sudah") || text.includes("already"))
          color = "orange";
        else if (text.includes("diproses")) color = "blue";
        return <span style={{ color }}>{text}</span>;
      },
    },
  ];

  return (
    <ConfigProvider theme={{ algorithm: antdTheme.darkAlgorithm }}>
      <Layout style={{ minHeight: "100vh", background: "#000" }}>
        <Content
          style={{
            maxWidth: 1200,
            width: "100%",
            margin: "auto",
            padding: "2rem",
          }}
        >
          <Title
            level={3}
            style={{ textAlign: "center", marginBottom: "2rem", color: "#fff" }}
          >
            QRCoin Claimer
          </Title>

          <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label="Auction ID">
                  <Input
                    type="number"
                    value={auctionId}
                    onChange={(e) => setAuctionId(e.target.value)}
                    required
                  />
                </Form.Item>
                <Form.Item label="SOCKS5 (opsional)">
                  <TextArea
                    rows={2}
                    value={proxyText}
                    onChange={(e) => setProxyText(e.target.value)}
                    placeholder="socks5://ip:port"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="List Username (1 per baris)">
                  <TextArea
                    rows={6}
                    value={usernameText}
                    onChange={(e) => setUsernameText(e.target.value)}
                    placeholder={`username1\nusername2\nusername3\nusername4\nusername50`}
                    required
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
              >
                {isLoading ? "⏳ Memproses..." : "🚀 Claim"}
              </Button>
            </Form.Item>

            {isLoading && <Progress percent={progress} status="active" />}
          </Form>

          {results.length > 0 && (
            <div style={{ marginTop: "2rem", overflowX: "auto" }}>
              <Table
                columns={columns}
                dataSource={results}
                pagination={false}
                bordered
                scroll={{ x: true }}
              />
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
