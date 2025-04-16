import * as React from "react";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "~/constant";
import type { Route } from "./+types/home";
import { io } from "socket.io-client";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatTanggal } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "~/components/ui/breadcrumb";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "~/components/ui/table";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Dashboard | Monitoring Sawi Menggunakan Internet Of Things" }, { name: "Sawiku", content: "Dashboard" }];
}

interface DataSensorType {
	type: "KELEMBAPAN_TANAH" | "SUHU_UDARA";
	value: number;
	createdAt: Date;
}

const socket = io(BACKEND_URL, {
	transports: ["websocket"],
});

const chartConfigKelembapanTanah = {
	kelembapanTanah: {
		label: "Kelembapan Tanah",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

const chartConfigSuhuUdata = {
	suhuUdara: {
		label: "SuhurUdara",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export default function Page() {
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [data, setData] = useState<{
		KELEMBAPAN_TANAH: DataSensorType[];
		SUHU_UDARA: DataSensorType[];
	}>({
		KELEMBAPAN_TANAH: [],
		SUHU_UDARA: [],
	});
	const [sensorNow, setSensorNow] = useState<{
		KELEMBAPAN_TANAH: DataSensorType | null;
		SUHU_UDARA: DataSensorType | null;
	}>({
		KELEMBAPAN_TANAH: null,
		SUHU_UDARA: null,
	});
	const [listDataSensor, setListDataSensor] = useState<{
		KELEMBAPAN_TANAH: DataSensorType[];
		SUHU_UDARA: DataSensorType[];
	}>({
		KELEMBAPAN_TANAH: [],
		SUHU_UDARA: [],
	});

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			console.log("GET 0");
			if (typeof window === "undefined") return;
			const accessToken = Cookies.get("token");
			console.log({ accessToken });
			if (!accessToken) {
				// navigate("/login");
				setIsLoading(false);
				return;
			}
			console.log("GET 1");
			try {
				console.log("GET 2");
				const response = await fetch(`${BACKEND_URL}/sensor`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				if (!response.ok) return;
				const result = await response.json();
				console.log({ result });
				const data = result.data;
				const dataKelembapan = data.filter((item: DataSensorType) => item.type === "KELEMBAPAN_TANAH");
				const dataSuhu = data.filter((item: DataSensorType) => item.type === "SUHU_UDARA");
				setData({ KELEMBAPAN_TANAH: dataKelembapan ?? [], SUHU_UDARA: dataSuhu ?? [] });
				setListDataSensor({ KELEMBAPAN_TANAH: dataKelembapan ?? [], SUHU_UDARA: dataSuhu ?? [] });
			} catch (error) {
				console.error("Error fetching data:", error);
				// Cookies.remove("token");
				// navigate("/login");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();

		if (socket) {
			socket.on("sensorKelembapan", (data) => {
				setSensorNow((prev) => ({ ...prev, KELEMBAPAN_TANAH: data }));
			});

			socket.on("sensorSuhu", (data) => {
				setSensorNow((prev) => ({ ...prev, SUHU_UDARA: data }));
			});

			socket.on("listSensorKelembapan", (data) => {
				setListDataSensor((prev) => ({ ...prev, KELEMBAPAN_TANAH: data }));
			});

			socket.on("listSensorSuhu", (data) => {
				setListDataSensor((prev) => ({ ...prev, SUHU_UDARA: data }));
			});
		}

		return () => {
			if (socket) {
				socket.off("sensorKelembapan");
				socket.off("sensorSuhu");
				socket.off("listSensorKelembapan");
				socket.off("listSensorSuhu");
			}
		};
	}, [navigate]);

	const handlerLogout = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsLoading(true);
		setError("");
		try {
			Cookies.remove("token");
			navigate("/login");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) return <p>Loading...</p>;

	return (
		<div className="bg-slate-50 h-full pb-16">
			<header className="flex sticky top-0 z-50 w-full items-center border-b bg-white">
				<div className="mx-auto w-[1200px] flex px-4 xl:px-0 h-12 items-center justify-between">
					<Breadcrumb className="block">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink
									href="/dashboard"
									className="font-semibold"
								>
									Dashboard Pendeteksi Tanaman Sawi
								</BreadcrumbLink>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="flex gap-4 items-center">
						<Button
							onClick={handlerLogout}
							variant="destructive"
							className="hover:cursor-pointer"
						>
							Keluar
						</Button>
					</div>
				</div>
			</header>

			<div className="xl:w-[1200px] mx-auto mt-4 grid gap-4 px-4 xl:px-0">
				<div>
					<h1 className="font-semibold text-2xl ">Dashboard Operator</h1>
					<p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Non ullam quam omnis ducimus eos in dolorum repellat dolore magnam quae.</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardDescription>Sensor Kelembapan Tanah</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{sensorNow?.KELEMBAPAN_TANAH?.value ?? data?.KELEMBAPAN_TANAH?.[data.KELEMBAPAN_TANAH.length - 1]?.value ?? "-"}</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Terakhir diupdate:</div>
							<div className="text-muted-foreground">{sensorNow?.KELEMBAPAN_TANAH?.createdAt ? formatTanggal(sensorNow?.KELEMBAPAN_TANAH?.createdAt) : data?.KELEMBAPAN_TANAH?.[data.KELEMBAPAN_TANAH.length - 1]?.createdAt ? formatTanggal(data?.KELEMBAPAN_TANAH?.[data.KELEMBAPAN_TANAH.length - 1]?.createdAt) : "-"}</div>
						</CardFooter>
					</Card>
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardDescription>Sensor Suhu Udara</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{sensorNow?.SUHU_UDARA?.value ?? data?.SUHU_UDARA?.[data.SUHU_UDARA.length - 1]?.value ?? "-"}</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Terakhir diupdate:</div>
							<div className="text-muted-foreground">{sensorNow?.SUHU_UDARA?.createdAt ? formatTanggal(sensorNow?.SUHU_UDARA?.createdAt) : data?.SUHU_UDARA?.[data.SUHU_UDARA.length - 1]?.createdAt ? formatTanggal(data?.SUHU_UDARA?.[data.SUHU_UDARA.length - 1]?.createdAt) : "-"}</div>
						</CardFooter>
					</Card>
				</div>

				<Card className="@container/card">
					<CardHeader className="relative">
						<CardTitle>List Data Suhu Kelembapan Tanah</CardTitle>
						<CardDescription>
							<span className="@[540px]/card:block">Total 50 data terakhir</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
						<ChartContainer
							config={chartConfigKelembapanTanah}
							className="aspect-auto h-[250px] w-full"
						>
							<AreaChart data={listDataSensor.KELEMBAPAN_TANAH}>
								<defs>
									<linearGradient
										id="fillDesktop"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--color-desktop)"
											stopOpacity={1.0}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-desktop)"
											stopOpacity={0.1}
										/>
									</linearGradient>
									<linearGradient
										id="fillMobile"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--color-mobile)"
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-mobile)"
											stopOpacity={0.1}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="createdAt"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={32}
									tickFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										});
									}}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											labelFormatter={(value) => {
												return new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												});
											}}
											indicator="dot"
										/>
									}
								/>
								<Area
									dataKey="value"
									type="natural"
									stackId="a"
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="@container/card">
					<CardHeader className="relative">
						<CardTitle>List Data Sensor Suhu Udara</CardTitle>
						<CardDescription>
							<span className="@[540px]/card:block">Total 50 data terakhir</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
						<ChartContainer
							config={chartConfigSuhuUdata}
							className="aspect-auto h-[250px] w-full"
						>
							<AreaChart data={listDataSensor.SUHU_UDARA}>
								<defs>
									<linearGradient
										id="fillDesktop"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--color-desktop)"
											stopOpacity={1.0}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-desktop)"
											stopOpacity={0.1}
										/>
									</linearGradient>
									<linearGradient
										id="fillMobile"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--color-mobile)"
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-mobile)"
											stopOpacity={0.1}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="createdAt"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={32}
									tickFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										});
									}}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											labelFormatter={(value) => {
												return new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												});
											}}
											indicator="dot"
										/>
									}
								/>
								<Area
									dataKey="value"
									type="natural"
									fill="var(--primary)"
									stroke="var(--color-mobile)"
									stackId="a"
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="relative">
						<CardTitle>Tabel Data Sensor</CardTitle>
						<CardDescription>
							<span className="@[540px]/card:block">Total 50 data terakhir</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
						<Table className="">
							<TableHeader>
								<TableRow>
									<TableHead className="w-1/3">Sensor</TableHead>
									<TableHead className="w-1/3">Nilai</TableHead>
									<TableHead className="w-1/3">Tanggal Pengambilan</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{[...data.KELEMBAPAN_TANAH, ...data.SUHU_UDARA]
									.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
									.map((item, index) => (
										<TableRow key={index}>
											<TableCell className="font-medium">{item.type === "KELEMBAPAN_TANAH" ? "Kelembapan Tanah" : "Suhu Udara"}</TableCell>
											<TableCell>{item.value}</TableCell>
											<TableCell>{formatTanggal(item.createdAt)}</TableCell>
										</TableRow>
									))}
							</TableBody>
							<TableFooter>
								<TableRow>
									<TableCell colSpan={2}>Total Data</TableCell>
									<TableCell className="text-right">{[...data.KELEMBAPAN_TANAH, ...data.SUHU_UDARA].length}</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
