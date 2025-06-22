import { createWeb3Modal, defaultConfig } from '@reown/appkit';
import { mintNFT } from './mint.js';

$(document).ready(() => {
  const projectId = '7c65f27254d6ddd24cf7eedf2685c4fb';
  const metadata = {
    name: 'Lawb.xyz',
    description: 'Windows 98-style NFT site',
    url: 'https://lawb.xyz',
    icons: ['/assets/favicon.ico']
  };
  const modal = createWeb3Modal({
    projectId,
    chains: ['ethereum'],
    ...defaultConfig({ metadata })
  });
  let connectedWallet = null;

  $('.icon[data-action="wallet"]').on('click', async () => {
    try {
      await modal.open();
      modal.on('connect', ({ address }) => {
        connectedWallet = address;
        console.log('Connected wallet:', connectedWallet);
        alert('Wallet connected: ' + connectedWallet);
      });
    } catch (error) {
      console.error('Wallet connect failed:', error);
      alert('Wallet connect failed: ' + error.message);
    }
  });

  $('.icon[data-action="mint"]').on('click', async () => {
    if (!connectedWallet) {
      alert('Please connect your wallet first!');
      return;
    }
    try {
      const result = await mintNFT(connectedWallet);
      alert('NFT Minted Successfully: ' + JSON.stringify(result));
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed: ' + error.message);
    }
  });

  $('.icon[data-action="popup"][data-popup-id="nft-popup"]').on('click', async () => {
    if (!connectedWallet) {
      alert('Please connect your wallet first!');
      return;
    }
    $('#nft-popup').show();
    try {
      const response = await fetch(`https://api.scatter.art/v1/collections/pixelawbs/nfts?walletAddress=${connectedWallet}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const nfts = await response.json();
      const nftList = $('#nft-list');
      nftList.empty();
      if (nfts.length) {
        nfts.forEach(nft => {
          nftList.append(`<img src="${nft.image}" alt="${nft.name}" style="max-width: 100px;" /><p>${nft.name}</p>`);
        });
      } else {
        nftList.append('<p>No NFTs found.</p>');
      }
    } catch (error) {
      console.error('Failed to load NFTs:', error);
      $('#nft-list').html('<p>Error loading NFTs.</p>');
    }
  });

  $('#generate-meme').on('click', () => {
    const canvas = document.getElementById('meme-canvas');
    const ctx = canvas.getContext('2d');
    const imageInput = document.getElementById('meme-image');
    const text = document.getElementById('meme-text').value;
    if (imageInput.files[0]) {
      const img = new Image();
      img.src = URL.createObjectURL(imageInput.files[0]);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.font = '30px Impact';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.fillText(text, 20, 50);
        ctx.strokeText(text, 20, 50);
      };
    }
  });

  $('.icon').draggable();
  $('.popup').draggable();
  $('.icon').on('click', function () {
    const action = $(this).data('action');
    if (action === 'url') {
      window.open($(this).data('url'), '_blank');
    } else if (action === 'popup') {
      $(`#${$(this).data('popup-id')}`).show();
    }
  });
  $('.close-btn').on('click', function () {
    $(this).closest('.popup').hide();
  });
  $('.menu-btn').on('click', () => {
    $('.menu').toggle();
  });
});