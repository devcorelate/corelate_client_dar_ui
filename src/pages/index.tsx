import type { NextPage } from 'next';
import Head from 'next/head';
import { Badge, Button, Card } from 'flowbite-react';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Hello World | Next.js Starter</title>
        <meta
          name="description"
          content="A clean Next.js, Tailwind CSS, and Flowbite React starter application."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(0,62,112,0.4),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.28),_transparent_30%)]" />
        <Card className="relative z-10 w-full max-w-2xl border-slate-800 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex flex-col items-center gap-6 text-center">
            <Badge color="purple" size="sm" className="w-fit px-3 py-1">
              Next.js 14
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
                Hello World
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                This is a clean Next.js + Tailwind CSS + Flowbite React starter
                foundation, ready for your next production application.
              </p>
            </div>
            <Button color="blue" size="lg" className="bg-primary hover:bg-primary/90">
              Start Building
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
};

export default Home;
