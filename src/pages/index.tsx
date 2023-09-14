import {
  getAddress,
  JsonRpcProvider,
  parseEther,
  toQuantity,
  Wallet,
} from "ethers";
import { useEffect, useState } from "react";
import { Client, Presets } from "userop";

const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const simpleAccountFactory = "0x9406Cc6185a346906296840746125a0E44976454";
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const pmContext = {
  type: "payg",
};
export default function Home() {
  const [account, setAccount] = useState<Presets.Builder.SimpleAccount | null>(
    null
  );

  const [events, setEvents] = useState<string[]>([
    `A sample application to demonstrate how to integrate self-custodial\nsocial login and transacting with Web3Auth and userop.js.`,
  ]);
  const [loading, setLoading] = useState(false);

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const pmUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;

  if (!rpcUrl) {
    throw new Error("RPC_URL is undefined");
  }

  if (!pmUrl) {
    throw new Error("PAYMASTER_RPC_URL is undefined");
  }

  const paymaster = true
    ? Presets.Middleware.verifyingPaymaster(pmUrl, pmContext)
    : undefined;
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        setAuthorized();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const createAccount = async (privateKey: string) => {
    return await Presets.Builder.SimpleAccount.init(
      new Wallet(privateKey) as any,
      rpcUrl,
      entryPoint,
      simpleAccountFactory,
      paymaster
    );
  };

  const setAuthorized = async () => {
    const acc = await createAccount(privateKey);
    setAccount(acc);
  };

  const login = async () => {
  };

  const logout = async () => {
    setAccount(null);
  };

  const addEvent = (newEvent: string) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const sendTransaction = async (recipient: string, amount: string) => {
    setEvents([]);
    if (!account) {
      throw new Error("Account not initialized");
    }
    addEvent("Sending transaction...");

    const client = await Client.init(rpcUrl, entryPoint);

    const target = getAddress(recipient);
    const value = parseEther(amount);
    const res = await client.sendUserOperation(
      account.execute(target, value, "0x"),
      {
        onBuild: async (op) => {
          addEvent(`Signed UserOperation: `);
          addEvent(JSON.stringify(op, null, 2) as any);
        },
      }
    );
    addEvent(`UserOpHash: ${res.userOpHash}`);

    addEvent("Waiting for transaction...");
    const ev = await res.wait();
    addEvent(`Transaction hash: ${ev?.transactionHash ?? null}`);
  };

  if (loading) {
    return <p>loading...</p>;
  }
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div></div>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="space-y-4">
            <div className="flex justify-end space-x-4">
              <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                Logged in as&nbsp;
                <code className="font-mono font-bold text-green-300">
                  {account?.getSender()}
                </code>
              </p>

              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 self-center"
              >
                Logout
              </button>
            </div>
            <div>
              <div className="grid grid-cols-3 grid-rows-2 gap-4">
                <div className="col-span-1 row-span-2">
                  <button
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                    onClick={() =>
                      sendTransaction(
                        "0x5DF100D986A370029Ae8F09Bb56b67DA1950548E",
                        "0"
                      )
                    }
                  >
                    <h2 className={`mb-3 text-2xl font-semibold`}>
                      Transfer{" "}
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                      Simple transfer of 0 ETH to an arbitrary address with
                      gas sponsored.
                    </p>
                  </button>
                </div>
                <div className="overflow-scroll col-start-2 col-span-2 row-span-2 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                  <div className="w-[1000px]">
                    <div className="block whitespace-pre-wrap justify-center ">
                      <pre>{events.join(`\n`)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
