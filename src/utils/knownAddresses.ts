// Central address classifier: returns { type, label } for any address
export function classifyAddress(address: string): { type: "Miner" | "Exchange" | "Privat" | "Emission", label: string } {
  // Emission contract (hardcoded, should match ergoflow.ts)
  const emissionAddress = "2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU";
  if (address === emissionAddress) return { type: "Emission", label: "Emission" };
  if (minerAddresses.includes(address)) {
    const label = minerNameMap[address] || "Miner";
    return { type: "Miner", label };
  }
  if (exchangeAddresses.includes(address)) return { type: "Exchange", label: "Exchange" };
  return { type: "Privat", label: "Privat" };
}
// Map miner addresses to pool names
export const minerNameMap: Record<string, string> = {
  // 2 miners
  "88dhgzEuTXaRQTX5KNdnaWTTX7fEZVEQRn6qP4MJotPuRnS3QpoJxYpSaXoU1y7SHp8ZXMp92TH22DBY": "2miners",
  // 666 pool
  "88dhgzEuTXaU9uJYAV8HTNzQL5pZrf7DovupdeBVm6msBjzLQjor8cp8DXaruQvyrAij6YxZAzzmbj8n": "666pool",
  // DX pool
  "88dhgzEuTXaUPpNAbKL7UeNUFEcjkoqW6ev5P1hkynBmG4L5baYdZ8rSPYCDNmvwBLiJR7ABjndPhqGm": "DXpool",
  // Hero miner
  "88dhgzEuTXaSuf5QC1TJDgdxqJMQEQAM6YaTTRqmUDrmPoVky1b16WAK5zMrq3p2mYqpUNKCyi5CLS9V": "HeroMiner",
  // Jj pool
  "88dhgzEuTXaS7z8MA868ZjU6ujmWi8Wqcx7VK36jcogWt8cRCKoGJYE6ezDe5g7f6fG7arqXNhuNP8Je": "JJPool",
  // K1 pool
  "88dhgzEuTXaTj2AZkM2vwnemCYyAUJymaFf8iJPUYmgLkJqQmPd3DTubYS5UfL75MhQbEjmuhBMbdspA": "K1Pool",
  // Kryptex
  "88dhgzEuTXaTnTZomXPfuJ67oYJPbrv17yNkLjN6Nj8HxZEUf2iAdiv9gTqmnKKa2i75zmUtDnPQovBb": "Kryptex",
  // Magic pool
  "88dhgzEuTXaTmFJfU5i58VVg6PRWfaAEWJ2qTgvVusnA2U1xw9NTsDYBpW4fTzkz2Cx7sGkQQYwnJ3xN": "MagicPool",
  // Nano pool
  "88dhgzEuTXaRp6WD5jWZSnXzBbA44g1xSMk6Xv2r6Cey8snSH78S6ZbWjP24yyPTDCCZByLpNXXe6NnN": "NanoPool",
  // Solo pool
  "88dhgzEuTXaRVtdXFwQFLD9NrGKjCP49pYiVAbptRRx9r4GbTmVZZYNDJGQ54AG4YjPpP5YkvvDUxBSd": "SoloPool",
  // Sigmanaut
  "88dhgzEuTXaQDYikoEkCMEPRxDiYnVRfiqhf3uLcMhbTPrTrrc7wkyF5LFMmgJyT4mPa6ucnmk3QTeUo": "Sigmanaut",
  // Wooly pooly
  "88dhgzEuTXaQ2HPUskY3hvgMA5uCbQWwZNPbMC1Hem9zM2V9U7KMah7LYWS4Hm4WECGuc22nofdQbHbY": "WoolyPooly",
};
// src/utils/knownAddresses.ts

export const exchangeAddresses = [
  // Coinex
  "9fPiW45mZwoTxSwTLLXaZcdekqi72emebENmScyTGsjryzrntUe",
  "9fowPvQ2GXdmhD2bN54EL9dRnio3kBQGyrD3fkbHwuTXD6z1wBU",
  "9gD9khJaxi3SvcX9VVPQ3vnV3xUTonVQe3Fvg5X7cGGbXMRgd8i",
  "9i51m3reWk99iw8WF6PgxbUT6ZFKhzJ1PmD11vEuGu125hRaKAH",

  // Gate.io
  "9enQZco9hPuqaHvR7EpPRWvYbkDYoWu3NK7pQk8VFwgVnv5taQE",
  "9gQYrh6yubA4z55u4TtsacKnaEteBEdnY4W2r5BLcFZXcQoQDcq",
  "9iKFBBrryPhBYVGDKHuZQW7SuLfuTdUJtTPzecbQ5pQQzD4VykC",

  // Huobi
  "9feMGM1qwNG8NnNuk3pz4yeCGm59s2RbjFnS7DxwUxCbzUrNnJw",

  // Kucoin
  "9fpUtN7d22jS3cMWeZxBbzkdnHCB46YRJ8qiiaVo2wRCkaBar1Z",
  "9fs7HkPGY9fhN6WsHd7V7LMcuMqsgseXzNahyToxJKwHCc1zc1c",
  "9guZaxPoe4jecHi6ZxtMotKUL4AzpomFf3xqXsFSuTyZoLbmUBr",
  "9hU5VUSUAmhEsTehBKDGFaFQSJx574UPoCquKBq59Ushv5XYgAu",
  "9how9k2dp67jXDnCM6TeRPKtQrToCs5MYL2JoSgyGHLXm1eHxWs",
  "9i8Mci4ufn8iBQhzohh4V3XM3PjiJbxuDG1hctouwV4fjW5vBi3",
  "9iNt6wfxSc3DSaBVp22E7g993dwKUCvbGdHoEjxF8SRqj35oXvT",

  // Mexc
  "9heCed7HKoDwUXAnKU6P4mZZq1emzX7s4wLgaKziaEtxnVQEod2",

  // Probit
  "9eg2Rz3tGogzLaVZhG1ycPj1dJtN4Jn8ySa2mnVLJyVJryb13QB",

  // Spectrum Finance
  "3gb1RZucekcRdda82TSNS4FZSREhGLoi1FxGDmMZdVeLtYYixPRviEdYireoM9RqC6Jf4kx85Y1jmUg5XzGgqdjpkhHm7kJZdgUR3VBwuLZuyHVqdSNv3eanqpknYsXtUwvUA16HFwNa3HgVRAnGC8zj8U7kksrfjycAM1yb19BB4TYR2BKWN7mpvoeoTuAKcAFH26cM46CEYsDRDn832wVNTLAmzz4Q6FqE29H9euwYzKiebgxQbWUxtupvfSbKaHpQcZAo5Dhyc6PFPyGVFZVRGZZ4Kftgi1NMRnGwKG7NTtXsFMsJP6A7yvLy8UZaMPe69BUAkpbSJdcWem3WpPUE7UpXv4itDkS5KVVaFtVyfx8PQxzi2eotP2uXtfairHuKinbpSFTSFKW3GxmXaw7vQs1JuVd8NhNShX6hxSqCP6sxojrqBxA48T2KcxNrmE3uFk7Pt4vPPdMAS4PW6UU82UD9rfhe3SMytK6DkjCocuRwuNqFoy4k25TXbGauTNgKuPKY3CxgkTpw9WfWsmtei178tLefhUEGJueueXSZo7negPYtmcYpoMhCuv4G1JZc283Q7f3mNXS",
  "5vSUZRZbdVbnk4sJWjg2uhL94VZWRg4iatK9VgMChufzUgdihgvhR8yWSUEJKszzV7Vmi6K8hCyKTNhUaiP8p5ko6YEU9yfHpjVuXdQ4i5p4cRCzch6ZiqWrNukYjv7Vs5jvBwqg5hcEJ8u1eerr537YLWUoxxi1M4vQxuaCihzPKMt8NDXP4WcbN6mfNxxLZeGBvsHVvVmina5THaECosCWozKJFBnscjhpr3AJsdaL8evXAvPfEjGhVMoTKXAb2ZGGRmR8g1eZshaHmgTg2imSiaoXU5eiF3HvBnDuawaCtt674ikZ3oZdekqswcVPGMwqqUKVsGY4QuFeQoGwRkMqEYTdV2UDMMsfrjrBYQYKUBFMwsQGMNBL1VoY78aotXzdeqJCBVKbQdD3ZZWvukhSe4xrz8tcF3PoxpysDLt89boMqZJtGEHTV9UBTBEac6sDyQP693qT3nKaErN8TCXrJBUmHPqKozAg9bwxTqMYkpmb9iVKLSoJxG7MjAj72SRbcqQfNCVTztSwN3cRxSrVtz4p87jNFbVtFzhPg7UqDwNFTaasySCqM",

  // Tidex
  "9fnmngbD5dHoKjAPYhX9FZcUVM8yxnNNM4JuYW3AHzcTZRyPUgo",

  // Trade Ogre
  "9fs99SejQxDjnjwrZ13YMZZ3fwMEVXFewpWWj63nMhZ6zDf2gif",

  // Waves
  "9gNYeyfRFUipiWZ3JR1ayDMoeh28E6J7aDQosb7yrzsuGSDqzCC",

  // Xeggex
  "9hphYTmicjazd45pz2ovoHVPz5LTq9EvXoEK9JMGsfWuMtX6eDu",
];

export const minerAddresses = [
  // 2 miners
  "88dhgzEuTXaRQTX5KNdnaWTTX7fEZVEQRn6qP4MJotPuRnS3QpoJxYpSaXoU1y7SHp8ZXMp92TH22DBY",

  // 666 pool
  "88dhgzEuTXaU9uJYAV8HTNzQL5pZrf7DovupdeBVm6msBjzLQjor8cp8DXaruQvyrAij6YxZAzzmbj8n",

  // DX pool
  "88dhgzEuTXaUPpNAbKL7UeNUFEcjkoqW6ev5P1hkynBmG4L5baYdZ8rSPYCDNmvwBLiJR7ABjndPhqGm",

  // Hero miner
  "88dhgzEuTXaSuf5QC1TJDgdxqJMQEQAM6YaTTRqmUDrmPoVky1b16WAK5zMrq3p2mYqpUNKCyi5CLS9V",

  // Jj pool
  "88dhgzEuTXaS7z8MA868ZjU6ujmWi8Wqcx7VK36jcogWt8cRCKoGJYE6ezDe5g7f6fG7arqXNhuNP8Je",

  // K1 pool
  "88dhgzEuTXaTj2AZkM2vwnemCYyAUJymaFf8iJPUYmgLkJqQmPd3DTubYS5UfL75MhQbEjmuhBMbdspA",

  // Kryptex
  "88dhgzEuTXaTnTZomXPfuJ67oYJPbrv17yNkLjN6Nj8HxZEUf2iAdiv9gTqmnKKa2i75zmUtDnPQovBb",

  // Magic pool
  "88dhgzEuTXaTmFJfU5i58VVg6PRWfaAEWJ2qTgvVusnA2U1xw9NTsDYBpW4fTzkz2Cx7sGkQQYwnJ3xN",

  // Nano pool
  "88dhgzEuTXaRp6WD5jWZSnXzBbA44g1xSMk6Xv2r6Cey8snSH78S6ZbWjP24yyPTDCCZByLpNXXe6NnN",

  // Solo pool
  "88dhgzEuTXaRVtdXFwQFLD9NrGKjCP49pYiVAbptRRx9r4GbTmVZZYNDJGQ54AG4YjPpP5YkvvDUxBSd",

  // Sigmanaut
  "88dhgzEuTXaQDYikoEkCMEPRxDiYnVRfiqhf3uLcMhbTPrTrrc7wkyF5LFMmgJyT4mPa6ucnmk3QTeUo",

  // Wooly pooly
  "88dhgzEuTXaQ2HPUskY3hvgMA5uCbQWwZNPbMC1Hem9zM2V9U7KMah7LYWS4Hm4WECGuc22nofdQbHbY",
];
